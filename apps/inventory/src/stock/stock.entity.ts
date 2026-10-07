import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('stock')
export class Stock {
  @PrimaryColumn('uuid')
  tenantId: string;

  @PrimaryColumn()
  product: string;

  @Column('int')
  quantity: number;
}
