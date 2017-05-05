package hex.api;

import hex.Interpret;
import water.*;
import water.api.*;
import water.api.schemas3.*;
import water.api.InterpretKeyV3;
import water.api.InterpretV3;

public class InterpretHandler extends Handler {


  public JobV3 makeInterpretModel(int version, InterpretV3 s) {
    Interpret interpret;
    if (s.destination_key != null)
      interpret = new Interpret(s.destination_key.key());
    else
      interpret = new Interpret(Key.<Interpret>make());
    s.fillImpl(interpret); //fill frame_id/model_id/nbins/etc.
    return new JobV3(interpret.execImpl());
  }

  public InterpretV3 fetchInterpretModel(int version, InterpretKeyV3 s) {
    Interpret interpret = DKV.getGet(s.key());
    return new InterpretV3().fillFromImpl(interpret);
  }


}
