package water.api.schemas3;

import hex.Interpret;
import water.Key;
import water.api.API;

/**
 * Partial dependence plot
 */
public class InterpretV3 extends SchemaV3<Interpret, InterpretV3> {
  @SuppressWarnings("unused")
  @API(help="Model", direction = API.Direction.INOUT)
  public KeyV3.ModelKeyV3 model_id;

  @SuppressWarnings("unused")
  @API(help="Frame", direction=API.Direction.INOUT)
  public KeyV3.FrameKeyV3 frame_id;

  @SuppressWarnings("unused")
  @API(help="Interpret Frame", direction=API.Direction.OUTPUT)
  public KeyV3.FrameKeyV3 interpret_id;

  @API(help="Key to store the destination", direction=API.Direction.INPUT)
  public KeyV3.InterpretKeyV3 destination_key;

  @Override public Interpret createImpl( ) { return new Interpret(Key.<Interpret>make()); }
}
