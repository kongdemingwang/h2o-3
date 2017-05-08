package hex;

import hex.Interpret;
import hex.tree.gbm.GBM;
import hex.tree.gbm.GBMModel;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import water.DKV;
import water.Key;
import water.TestUtil;
import water.fvec.Frame;
import water.fvec.Vec;
import water.util.Log;
import water.util.TwoDimTable;

public class InterpretTest extends TestUtil {
    @BeforeClass()
    public static void setup() {
        stall_till_cloudsize(1);
    }

    @Test
    public void testKLime() {
        Frame fr=null;
        GBMModel model=null;
        Interpret interpret=null;
        try {
            // Frame
            fr = parse_test_file("smalldata/prostate/prostate.csv");
            Vec v = fr.remove("CAPSULE");
            fr.add("CAPSULE",v.toCategoricalVec());
            v.remove();
            DKV.put(fr);
            GBMModel.GBMParameters parms = new GBMModel.GBMParameters();
            parms._train = fr._key;
            parms._ntrees = 10;
            parms._ignored_columns = new String[]{"ID"};
            parms._response_column = "CAPSULE";
            model = new GBM(parms).trainModel().get();

            interpret = new Interpret(Key.<Interpret>make());
            interpret._frame_id = fr._key;
            interpret._model_id = (Key) model._key;
            interpret.execImpl().get();

        } finally {
            if (fr!=null) fr.remove();
            if (model!=null) model.remove();
            if (interpret.kLimeModel!=null) interpret.kLimeModel.remove();
            if (interpret._interpret_frame!=null) interpret._interpret_frame.remove();
            if (interpret!=null) interpret.remove();
        }
    }
}
