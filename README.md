# DesynV2 Subgraph

### Services

| Service                          | address               |
|----------------------------------|-----------------------|
| JSON-RPC Server                  | http://localhost:8545 |
| GraphQL HTTP server              | http://localhost:8000 |
| Graph Node JSON-RPC admin server | http://localhost:8020 |
| Graph Node IndexNode server      | http://localhost:8030 |
| Graph Node Metrics server        | http://localhost:8040 |
| Graph Node WebSocket server      |   ws://localhost:8001 |


## Components
### Subgraph

Clone the DesynV2 subgraph

```
git clone git@github.com:Meta-DesynLab/DesynV2-subgraph.git
```

Update deployed contract address in subgraph.yaml to the ones listed as part of the deploy

Install dependencies

```
yarn
```

Generate the graph code

```
yarn codegen
```

Create local node

```
yarn create:local
```

Deploy locally

```
yarn deploy:local
```
