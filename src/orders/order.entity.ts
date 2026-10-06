import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerName: string;

  @Column()
  product: string;

  @Column('int')
  quantity: number;

  @Column({ default: 'pending' })
  status: string;

  @Column('uuid')
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
