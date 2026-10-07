import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity('orders')
@Index(['tenantId', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field()
  customerName: string;

  @Column()
  @Field()
  product: string;

  @Column('int')
  @Field(() => Int)
  quantity: number;

  @Column({ default: 'pending' })
  @Field()
  status: string;

  @Column('uuid')
  @Field()
  tenantId: string;

  @CreateDateColumn()
  @Field()
  createdAt: Date;
}
