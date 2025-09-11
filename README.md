# How to release
## How to get release upload url
`gh release view [tagName] --json uploadUrl` i.e. this project's tagName is `v1.0.0`
This project uses github actions to CI, alternative ways could be

## Use android studio 
After update code, run 
```
./build.sh
```
It will auto open android studio then `build apk` there

## Use gradle
`npm run release`
Then you can see apk in 
`app/build/outputs/apk/<buildType>/app-<buildType>.apk`

# How to run on web
```
ionic build (if code changed)
ionic serve
```
# How to sign
Run `keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release-key` to generate `my-release-key.jks` and put it into `/android/app`.

This file can store multiple key, so alias is the unique symbol for each key (i.e. here we created a key named `release-key`). `-keystore` means keystore will also use the key password you provide later (it's like the whole keystore needs a password and each key also needs password)

To check generated keys, run `keytool -v -list -keystore  my-release-key.jks`
Then add 
```
signingConfigs {
    release {
        storeFile file("my-release-key.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")   // keystore 密码
        keyAlias System.getenv("KEY_ALIAS")               // keystore 里 key 的名字
        keyPassword System.getenv("KEY_PASSWORD")         // 这个 key 的密码
    }
}
```
into `android/app/build.gradle` inside `android{}` section
add
`signingConfig signingConfigs.release` 
into `android.buildTypes.release