package water.api;

import hex.Interpret;
import water.Iced;
import water.Key;
import water.api.schemas3.KeyV3;

/**
 * Created by mkcha on 5/4/2017.
 */
public class InterpretKeyV3 extends KeyV3<Iced, InterpretKeyV3, Interpret> {
    public InterpretKeyV3() {}
    public InterpretKeyV3(Key<Interpret> key) { super(key); }
}
