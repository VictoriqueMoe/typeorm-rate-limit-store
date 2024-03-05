# rate-limit-typeorm

A [`TypeORM`](https://typeorm.io) store for [`express-rate-limit`](https://github.com/nfriedly/express-rate-limit)

## Installation

```sh
npm install typeorm-rate-limit-store
```

## Usage

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

### Instantiate the store passing in the model

```ts
import {ExpressRateLimitTypeOrmStore} from 'typeorm-rate-limit-store';
import {ExpressRateLimitStoreModel} from "ExpressRateLimitStoreModel.js";

const reposetry = getDatastore().getRepository(ExpressRateLimitStoreModel)
app.use(
    rateLimit({
        windowMs: 1000,
        limit: 1,
        standardHeaders: true,
        store: new ExpressRateLimitTypeOrmStore(reposetry),
    }),
);
```

Both CJS and ESM modules are provided, but it is assumed you will be using ESM as this package exports that as default
