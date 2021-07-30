#include <napi.h>
#include "pi-worker.h"  // NOLINT(build/include)
#include <math.h>

class PiWorker : public Napi::AsyncWorker {
public:
    PiWorker(Napi::Env &env, int points)
        : Napi::AsyncWorker(env),
          points(points),
          estimate(0),
          deferred(Napi::Promise::Deferred::New(env))
    {}

    ~PiWorker() {}

    // Executed inside the worker-thread.
    // It is not safe to access JS engine data structure
    // here, so everything we need for input and output
    // should go on `this`.
    void Execute() {
        int count = 0;
        for (int i = 0; i < points; ++i) {
            float x = float(rand()) / RAND_MAX;
            float y = float(rand()) / RAND_MAX;
            if (sqrt(x * x + y * y) < 1)
                count++;
        }
        estimate = 4.0 * count / points;

        // you could handle errors as well
        // throw std::runtime_error("test error");
        // or like
        // Napi::AsyncWorker::SetError
        // Napi::AsyncWorker::SetError("test error");
    }

    // Executed when the async work is complete
    // this function will be run inside the main event loop
    // so it is safe to use JS engine data again
    void OnOK() {
        deferred.Resolve(Napi::Number::New(Env(), estimate));
    }

    void OnError(Napi::Error const &error) {
        deferred.Reject(error.Value());
    }

    Napi::Promise GetPromise() { return deferred.Promise(); }

private:
    int points;
    double estimate;
    Napi::Promise::Deferred deferred;
};

Napi::Value CalculatePiAsync(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    int points = info[0].As<Napi::Number>().Uint32Value();

    PiWorker *piWorker = new PiWorker(env, points);

    auto promise = piWorker->GetPromise();

    piWorker->Queue();

    return promise;
}
