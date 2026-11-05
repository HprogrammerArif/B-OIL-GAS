package bd.com.bogcl.bogcl_oneops

import android.view.WindowManager
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

// local_auth (biometric prompt) requires a FragmentActivity host.
class MainActivity : FlutterFragmentActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "bogcl.oneops/secure_flag",
        ).setMethodCallHandler { call, result ->
            if (call.method == "set") {
                val on = call.argument<Boolean>("on") == true
                window?.let { w ->
                    if (on) {
                        w.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                    } else {
                        w.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                    }
                }
                result.success(null)
            } else {
                result.notImplemented()
            }
        }
    }
}
