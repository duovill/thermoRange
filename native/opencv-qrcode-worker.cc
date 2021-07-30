#include <napi.h>
#include "pi-worker.h"  // NOLINT(build/include)
#include <math.h>

#include <opencv2/objdetect.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>

using namespace std;
using namespace cv;

class QrCodeWorker : public Napi::AsyncWorker {
public:
    QrCodeWorker(Napi::Env &env, string filename)
        : Napi::AsyncWorker(env),
          filename(filename),
          deferred(Napi::Promise::Deferred::New(env))
    {}

    ~QrCodeWorker() {}

    // Executed inside the worker-thread.
    // It is not safe to access JS engine data structure
    // here, so everything we need for input and output
    // should go on `this`.
    void Execute() {
        QRCodeDetector qrDecoder = QRCodeDetector();
        cout << this->filename << "\n";
        Mat src = imread(this->filename);

       if(src.empty())
       {
           throw std::runtime_error(std::string("Cannot open file: ") + filename);
       }

        this->data = qrDecoder.detectAndDecode(src);
        cout << "detectAndDecode: " << this->data << "\n";

    }

    // Executed when the async work is complete
    // this function will be run inside the main event loop
    // so it is safe to use JS engine data again
    void OnOK() {
        deferred.Resolve(Napi::String::New(Env(), this->data));
    }

    void OnError(Napi::Error const &error) {
        deferred.Reject(error.Value());
    }

    Napi::Promise GetPromise() { return deferred.Promise(); }

private:
    string filename;
    string data;
    Napi::Promise::Deferred deferred;
};

Napi::Value ReadQrCodeAsync(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    string filename = info[0].As<Napi::String>().ToString();

    QrCodeWorker *qrCodeWorker = new QrCodeWorker(env, filename);

    auto promise = qrCodeWorker->GetPromise();

    qrCodeWorker->Queue();

    return promise;
}
