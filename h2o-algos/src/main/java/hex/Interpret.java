package hex;

import hex.aggregator.Aggregator;
import hex.aggregator.AggregatorModel;
import hex.klime.KLimeModel;
import jsr166y.CountedCompleter;
import org.apache.commons.lang.ArrayUtils;
import water.*;
import water.api.InterpretKeyV3;
import water.api.schemas3.KeyV3;
import water.fvec.Frame;
import water.fvec.Vec;
import water.rapids.Rapids;
import water.util.Log;
import hex.klime.KLime;
import java.util.Arrays;

/**
 * Create a Frame from scratch
 * If randomize = true, then the frame is filled with Random values.
 */
public class Interpret extends Lockable<Interpret> {
  final static int MAX_POINTS = 5000;
  transient final public Job _job;
  public Key<Model> _model_id;
  public Key<Frame> _frame_id;
  public Key<Frame> _interpret_id; //OUTPUT
  public KLimeModel kLimeModel;
  public AggregatorModel agg;
  public Frame _interpret_frame;
  public Frame _klimeFrame;
  public Frame _modelPreds;

  public Interpret(Key<Interpret> dest) {
    super(dest);
    _job = new Job<>(dest, Interpret.class.getName(), "Interpret");
  }

  public Job<Interpret> execImpl() {
    checkSanityAndFillParams();
    delete_and_lock(_job);
    //_frame_id.get().write_lock(_job._key);
    // Don't lock the model since the act of unlocking at the end would
    // freshen the DKV version, but the live POJO must survive all the way
    // to be able to delete the model metrics that got added to it.
    // Note: All threads doing the scoring call model_id.get() and then
    // update the _model_metrics only on the temporary live object, not in DKV.
    // At the end, we call model.remove() and we need those model metrics to be
    // deleted with it, so we must make sure we keep the live POJO alive.
    _job.start(new InterpretDriver(), 3); //predict, run klime, join klime pred frame
    return _job;
  }

  private void checkSanityAndFillParams() {
    Model m = _model_id.get();
    if (m==null) throw new IllegalArgumentException("Model not found.");
    if (!m._output.isSupervised() || m._output.nclasses() > 2)
      throw new IllegalArgumentException("Model interpretation KLime plots are only implemented for regression and binomial classification models");
    //Frame f = _frame_id.get();
    if (_frame_id==null) {
        Log.info("Using Training Frame for KLime");
        _frame_id = m._parms._train;
    }
    //final Frame fr = _frame_id.get();
  }

  private class InterpretDriver extends H2O.H2OCountedCompleter<InterpretDriver> {
    public void compute2() {
      assert (_job != null);
      final Frame fr = _frame_id.get();
      final Model m = _model_id.get();
      try {
        _job.update(0,"Scoring frame:" + _frame_id.toString());
        _modelPreds = m.score(fr,null,_job,false);
        fr.add(new Frame(new String[]{"model_pred"},new Vec[]{_modelPreds.vec(2)}));
        Key<Model> klimeModelKey = Key.make();

        _job.update(1,"Running KLime:");
        Job klimeJob = new Job<>(klimeModelKey,ModelBuilder.javaName("klime"), "Interpret with KLime");

        // Run KLime
        KLime klBuilder = ModelBuilder.make("klime",klimeJob,klimeModelKey);
        klBuilder._parms._ignored_columns = (String[]) ArrayUtils
                .addAll(m._parms._ignored_columns, new String[]{m._parms._response_column});
        klBuilder._parms._seed = 12345;
        klBuilder._parms._estimate_k = true;
        klBuilder._parms._response_column = "model_pred";
        klBuilder._parms._train = _frame_id;
        kLimeModel = klBuilder.trainModel().get();
        Key<Frame> klimePredKey = Key.<Frame>make();
        _job.update(2,"Scoring KLime:");
        _klimeFrame = kLimeModel.score(fr,klimePredKey.toString(),_job,false);
        _klimeFrame.add(new Frame(new String[]{"model_pred"},new Vec[]{_modelPreds.vec(2)}));
        DKV.put(_klimeFrame);
        // Keep the KLimeFrame for user lookups


        // Prep Plotting Frame
        _job.update(2,"Preparing frame plot");
        AggregatorModel.AggregatorParameters parms = new AggregatorModel.AggregatorParameters();
        parms._train = _klimeFrame._key;
        long start = System.currentTimeMillis();
        agg = new Aggregator(parms).trainModel().get();
        System.out.println("AggregatorModel finished in: " + (System.currentTimeMillis() - start)/1000. + " seconds");
        agg.checkConsistency();

        // Sort the aggregated frame
        String rapidsRoundCmd = "(append " + agg._output._output_frame + " (floor (* (round (cols_py " +
                agg._output._output_frame + " \'model_pred\') 6) 1000000)) \'pred_score\')";
        Frame tmpFrame2 = Rapids.exec(rapidsRoundCmd).getFrame();
        tmpFrame2._key = Key.<Frame>make();
        DKV.put(tmpFrame2);
        Frame tmpFrame3 = tmpFrame2.sort(new int[]{ArrayUtils.indexOf(tmpFrame2._names, "pred_score")});
        tmpFrame2.remove();
        tmpFrame3.add(new Frame(new String[]{"ones"},
                new Vec[]{tmpFrame3.anyVec().makeCon(1.0)}));
        tmpFrame3._key = Key.<Frame>make();
        DKV.put(tmpFrame3);

        String rapidsIdxCmd = "(append " + tmpFrame3._key + " (cumsum (cols_py " + tmpFrame3._key +
                " \'ones\') 0) \'idx\')";
        _interpret_frame = Rapids.exec(rapidsIdxCmd).getFrame();
        _interpret_frame.remove("pred_score").remove();
        _interpret_frame.remove("ones").remove();
        _interpret_frame._key = Key.<Frame>make();
        DKV.put(_interpret_frame);
        _interpret_id = _interpret_frame._key;

        tmpFrame3.remove();
      } finally {
        fr.remove("model_pred");
        DKV.put(fr); //update the DKV
      }
      _job.update(3);
      update(_job);
      tryComplete();
    }

    @Override
    public void onCompletion(CountedCompleter caller) {
      //_frame_id.get().unlock(_job._key);
      unlock(_job);
    }

    @Override
    public boolean onExceptionalCompletion(Throwable ex, CountedCompleter caller) {
      //_frame_id.get().unlock(_job._key);
      unlock(_job);
      return true;
    }
  }

  @Override public Class<InterpretKeyV3> makeSchema() { return InterpretKeyV3.class; }
}

