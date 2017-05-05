package hex;

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
  transient final public Job _job;
  public Key<Model> _model_id;
  public Key<Frame> _frame_id;
  public Key<Frame> _interpret_id; //OUTPUT

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
    final Frame fr = _frame_id.get();
  }

  private class InterpretDriver extends H2O.H2OCountedCompleter<InterpretDriver> {
    public void compute2() {
      assert (_job != null);
      final Frame fr = _frame_id.get();
      final Model m = _model_id.get();
      try {
        //Scope.enter();
        _job.update(0,"Scoring frame:" + _frame_id.toString());
        //Frame modelPreds = Scope.track(m.score(fr,null,_job,false));
        Frame modelPreds = m.score(fr,null,_job,false);
        //fr.add(modelPreds.subframe(new String[]{"p1"}));
        fr.add(new Frame(new String[]{"model_pred"},new Vec[]{modelPreds.vec(2)}));
        Key<Model> klimeModelKey = Key.make();
        _job.update(1,"Running KLime:");
        Job klimeJob = new Job<>(klimeModelKey,ModelBuilder.javaName("klime"), "Interpret with KLime");
        KLime klBuilder = ModelBuilder.make("klime",klimeJob,klimeModelKey);
        klBuilder._parms._ignored_columns = (String[]) ArrayUtils.addAll(m._parms._ignored_columns, new String[]{m._parms._response_column});
        klBuilder._parms._max_k = 6;
        klBuilder._parms._seed = 12345;
        //klBuilder._parms._distribution = m._parms._distribution;
        klBuilder._parms._estimate_k = false;
        klBuilder._parms._response_column = "model_pred";
        klBuilder._parms._train = _frame_id;
        KLimeModel kLimeModel = klBuilder.trainModel().get();
        Key<Frame> interpretFrameKey = Key.<Frame>make();
        _job.update(2,"Scoring KLime:");
        //Frame interpretFrame = Scope.track(kLimeModel.score(fr,interpretFrameKey.toString(),_job,false));
        Frame interpretFrame = kLimeModel.score(fr,interpretFrameKey.toString(),_job,false);
        interpretFrame.add(new Frame(new String[]{"model_pred"},new Vec[]{modelPreds.vec(2)}));
        DKV.put(interpretFrame);
        _job.update(3,"Preparing frame plot");
        String rapidsRoundCmd = "(append " + interpretFrameKey + " (floor (* (round (cols_py " + interpretFrameKey + " \'model_pred\') 6) 1000000)) \'pred_score\')";
        //Frame tmpFrame = Scope.track(Rapids.exec(rapidsRoundCmd).getFrame());
        Frame tmpFrame = Rapids.exec(rapidsRoundCmd).getFrame();
        Frame tmpFrame2 = tmpFrame.sort(new int[]{ArrayUtils.indexOf(tmpFrame._names, "pred_score")});
        tmpFrame2.add(new Frame(new String[]{"ones"},
                new Vec[]{tmpFrame2.anyVec().makeCon(1.0)}));
        tmpFrame2._key = Key.<Frame>make();
        DKV.put(tmpFrame2);
        String rapidsIdxCmd = "(append " + tmpFrame2._key + " (cumsum (cols_py " + tmpFrame2._key + " \'ones\') 0) \'idx\')";
        Frame tmpFrame3 = Rapids.exec(rapidsIdxCmd).getFrame();
        tmpFrame3._key = Key.<Frame>make();
        DKV.put(tmpFrame3);
        _interpret_id = tmpFrame3._key;
      } finally {
        //Scope.exit();
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

