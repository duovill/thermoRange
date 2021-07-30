#include <napi.h>
#include "pi-worker.h"
#include "opencv-qrcode-worker.h"


Napi::Object Init(Napi::Env env, Napi::Object exports) {

    srand((unsigned) (time(0)));

    exports.Set(Napi::String::New(env, "piWorker"), Napi::Function::New(env, CalculatePiAsync));
    exports.Set(Napi::String::New(env, "readQrCode"), Napi::Function::New(env, ReadQrCodeAsync));

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
