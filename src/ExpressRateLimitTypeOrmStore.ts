import type { ClientRateLimitInfo, IncrementResponse, Options, Store } from "express-rate-limit";
import type { IExpressRateLimitModel } from "./IExpressRateLimitModel.js";
import type { Repository } from "typeorm";

export class ExpressRateLimitTypeOrmStore implements Store {
    private windowMs!: number;

    public constructor(
        private readonly repo: Repository<IExpressRateLimitModel>,
        public readonly prefix = "rl_",
    ) {}

    public init(options: Options): void {
        this.windowMs = options.windowMs;
        setInterval(() => this.clearExpired(), this.windowMs);
    }

    private prefixKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    private async clearExpired(): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .delete()
            .where("resetTime < :currentDate", {
                currentDate: new Date(),
            })
            .execute();
    }

    public async get(key: string): Promise<ClientRateLimitInfo | undefined> {
        const fromDb = await this.getFromDb(key);
        if (fromDb) {
            return this.transform(fromDb);
        }
    }

    private async getResponse(key: string): Promise<IExpressRateLimitModel> {
        const fromDb = await this.getFromDb(key);
        if (fromDb) {
            return fromDb;
        }
        const newModel: IExpressRateLimitModel = {
            key: this.prefixKey(key),
            resetTime: new Date(Date.now() + this.windowMs),
            totalHits: 0,
        };
        return this.repo.save(newModel);
    }

    public async increment(key: string): Promise<IncrementResponse> {
        const resp = await this.getResponse(key);
        const now = Date.now();
        if (resp.resetTime && resp.resetTime.getTime() <= now) {
            this.resetClient(resp, now);
        }
        resp.totalHits++;
        return this.transform(await this.repo.save(resp));
    }

    private resetClient(client: IExpressRateLimitModel, now = Date.now()): IncrementResponse {
        client.totalHits = 0;
        client.resetTime.setTime(now + this.windowMs);
        return client;
    }

    public async decrement(key: string): Promise<void> {
        const fromDb = await this.getFromDb(key);
        if (!fromDb) {
            return;
        }
        fromDb.totalHits--;
        await this.repo.save(fromDb);
    }

    public async resetKey(key: string): Promise<void> {
        await this.repo.delete({
            key: this.prefixKey(key),
        });
    }

    public async resetAll(): Promise<void> {
        await this.repo.clear();
    }

    private transform(model: IExpressRateLimitModel): ClientRateLimitInfo {
        return {
            totalHits: model.totalHits,
            resetTime: model.resetTime,
        };
    }

    private getFromDb(key: string): Promise<IExpressRateLimitModel | null> {
        return this.repo.findOneBy({
            key: this.prefixKey(key),
        });
    }

    public get localKeys(): boolean {
        return false;
    }
}
