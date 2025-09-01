# How to release

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
