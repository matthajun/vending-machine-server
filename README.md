# vending-machine-server

- [Description](#description)
- [실행](#실행)
- [TEST](#TEST)

## Description

부릉 실무 과제 제출

## 실행
1. 사전 설치 필요
    - docker
    - node
    - yarn
2. 아래 명령어로 docker compose 를 실행한다.
   > $ docker compose up -d
3. 스웨거에 접속하여 정상적으로 실행되는지 확인한다.
    - `http://localhost:<PORT>/<API_DOC_PATH>`

## TEST
### E2E test
- 관련 파일
    - ./test/*
- 수동 실행
  > $ yarn test:e2e