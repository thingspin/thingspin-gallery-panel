# proj-edge-ai-app

# Requirement
## nodejs
- 8.x
## NPM(Node Pacakge Manager)
- v5.6 or higher
- yarn
- grunt

# pre installed
```
# yarn 명령어가 실행되지 않은 경우 아래의 명령을 실행해 주세요.
sudo npm install -g yarn
# grunt 명령어가 실행되지 않은 경우 아래의 명령을 실행해 주세요.
sudo npm install grunt-cli
```

# Build
```
yarn install
grunt
```
# API 사용전 유의 사항
custom.ini에 다음 사항을 추가. 
입력한 path에서 없는 디렉토리가 있다면 만들어주어야함.
또한, ml/config 디렉토리도 필요함.

[assets]
ml = data/thingspin/ml

# Backend API

|Rest Type | API                                     | Description                                                     |
|----------|-----------------------------------------|-----------------------------------------------------------------|
| GET      | api/ml                                  |모든 등록된 configuration 정보를 가져온다.                              |
| GET      | api/ml/:cid                             |특정 configuration 정보를 가져온다.                                   |
| GET      | api/ml/:cid/modelDownload/:fileName     |특정 configuration 에서 특정 모델 파일을 가져온다.                        |
| GET      | api/ml/:cid/algorithmDownload/:fileName |특정 configuration 에서 특정 알고리즘 파일을 가져온다.                     |
| POST     | api/ml                                  |입력된 모든 configuration 정보를 저장한다.                              |
|          |                                         |저장위치는 {custom.ini의 ml path}/config/cid.                        |
|          |                                         |cid는 save 버튼 클릭시 입력한 이름.                                     |
| PUT      | api/ml:cid                              |특정 configuration 정보를 수정한다.                                    |
| POST     | api/ml/:cid/start                       |등록된 configuration를 run 한다.                                     |
| POST     | api/ml/:cid/stop                        |running 중인 configuration를 stop 시킨다.                            |
| Delete   | api/ml:cid                              |등록된 configuration를 삭제한다.                                      |
| GET      | api/ml/:cid/check                       |등록된 configuration의 프로세스 상태가 running 중인지 확인.                |
|          |                                         |OS의 프로세스 상태와 비교하여 틀리면 DB file를 update한다.                  |
------------------------------------------------------------------------------------------------------------------------

1. GET : api/ml/get

[example in javascript]
```javascript
this.backendSrv.get('api/ml').then(result => {
      // Use result.Result
      console.log(result.Result);
});
```

2. POST : api/ml/save
[request body 정보]
```go
type MLsaveReq struct {
	Cid         	string 					`form:"cid"`
	Cname       	string  				`form:"cname"`
	Model       	string  				`form:"model"`
	Framework   	string  				`form:"framework"`
	InputInfo   	string  				`form:"inputInfo"`
	OutputInfo  	string  				`form:"outputInfo"`
	ModelFiles 		[]string 				`form:"modelFiles"`
	AlgorithmFiles	[]string 				`form:"algorithmFiles"`
	AlgorithmType   string  				`form:"algorithmType"`
	AlgorithmName	string  				`form:"algorithmName"`
	UploadModel 	[]*multipart.FileHeader `form:"model[]"`
	UploadAlgorithm []*multipart.FileHeader	`form:"algorithm[]"`
}
```
[example in javascript]
```javascript
var data = new FormData();
data.append("cid","test1");
data.append("cname","test1");
data.append("model","test1");
data.append("framework","test1");
data.append("inputInfo","test1");
data.append("outputInfo","test1");
data.append("algorithmType","test1");
data.append("algorithmName","test1");


for (let model of modelList) {
  data.append('model[]', model);
}
for (let algorithm of algorithmList) {
  data.append('algorithm[]', algorithm);
}

this.http({
  method: 'POST',
  url: 'api/ml',
  data: data,
  headers: { 'Content-Type': undefined },
  transformResponse: angular.identity,
}).then(result => {
  console.log(result);
});
```
3. PUT : api/ml/:cid - 등록된 configuration를 수정한다.
```javascript
this.backendSrv.POST('api/ml/:cid/start').then(result => {
});

4. POST : api/ml/:cid/start - 등록된 configuration를 run 한다.

```javascript
this.backendSrv.POST('api/ml/:cid/start').then(result => {
});
```

5. POST : api/ml/:cid/stop - running 중인 configuration를 stop 시킨다.

```javascript
this.backendSrv.put('api/ml/:cid/stop').then(result => {
});
```

6. Delete : api/ml/:cid - 등록된 configuration를 삭제한다.
```javascript
this.backendSrv.delete('api/ml/:cid').then(result => {
});
```

7. GET : api/ml/check
```javascript
this.backendSrv.get('api/ml/check').then(result => {
});
```
# live service for checking logs
```javascript
import { liveSrv } from 'app/core/core';

// Start logging
var observable = liveSrv.subscribe('service_' + cid);
this.subscription = observable.subscribe(data => {
console.log(data);
});

// Stop logging
liveSrv.removeObserver('service_' + this.isLogging, null);
this.subscription.unsubscribe();

```


