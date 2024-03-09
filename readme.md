# rate-limit-typeorm

A [`TypeORM`](https://typeorm.io) store for [`express-rate-limit`](https://github.com/nfriedly/express-rate-limit).  
Designed for use with TypeORM as a backing store for express rate limiting in a clustered environment.

## Installation

```sh
npm install typeorm-rate-limit-store
```

## Usage

You will need to implement an entity for the rate-limiting model, and then instantiate the store by passing in that model.

### Implement the `IExpressRateLimitModel` entity:

```ts
// ExpressRateLimitStoreModel.ts
import { Column, Entity, PrimaryColumn } from "typeorm";
import type {IExpressRateLimitModel} from 'typeorm-rate-limit-store';

@Entity()
export class ExpressRateLimitStoreModel implements IExpressRateLimitModel{
    @PrimaryColumn()
    public key: string;

    @Column()
    public totalHits: number;

    @Column()
    public resetTime: Date;
}
```

### Instantiate the store passing in the model:

```ts
import {ExpressRateLimitTypeOrmStore} from 'typeorm-rate-limit-store';
import {ExpressRateLimitStoreModel} from "ExpressRateLimitStoreModel.js";

const repository = getDatastore().getRepository(ExpressRateLimitStoreModel)
app.use(
    rateLimit({
        windowMs: 1000,
        limit: 1,
        standardHeaders: true,
        store: new ExpressRateLimitTypeOrmStore(repository),
    }),
);
```

### Options:
The `ExpressRateLimitTypeOrmStore` constructor takes the following parameters:

| Option     | Description                                                                                                         | Required |
|------------|:--------------------------------------------------------------------------------------------------------------------|----------|
| repository | The type orm repository that is built from the `IExpressRateLimitModel` interface                                   | True     |
| prefix     | A string that will prefix the key, use this if you require multiple instances of the `ExpressRateLimitTypeOrmStore` | False    |


Both CJS and ESM modules are provided, but it is assumed you will be using ESM as this package exports that as the default.
