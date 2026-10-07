import { Column, Entity, PrimaryColumn } from 'typeorm';

// One row per (tenant, product), so the pair is the primary key.
@Entity('stock')
export class Stock {
  @PrimaryColumn('uuid')
  tenantId: string;

  @PrimaryColumn()
  product: string;

  @Column('int')
  quantity: number;
}
