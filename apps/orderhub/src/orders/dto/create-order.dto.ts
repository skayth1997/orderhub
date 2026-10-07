import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class CreateOrderDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  product: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}
