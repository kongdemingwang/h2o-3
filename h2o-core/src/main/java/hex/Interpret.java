package hex;

import jsr166y.CountedCompleter;
import water.*;
import water.api.schemas3.KeyV3;
import water.fvec.Frame;
import water.fvec.Vec;
import water.util.Log;
import water.util.TwoDimTable;

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
    _frame_id.get().write_lock(_job._key);
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
      _interpret_id = _frame_id;
      _job.update(3);
      update(_job);
      tryComplete();
    }

    @Override
    public void onCompletion(CountedCompleter caller) {
      _frame_id.get().unlock(_job._key);
      unlock(_job);
    }

    @Override
    public boolean onExceptionalCompletion(Throwable ex, CountedCompleter caller) {
      _frame_id.get().unlock(_job._key);
      unlock(_job);
      return true;
    }
  }

  @Override public Class<KeyV3.InterpretKeyV3> makeSchema() { return KeyV3.InterpretKeyV3.class; }
}

