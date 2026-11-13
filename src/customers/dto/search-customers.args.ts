import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

@ArgsType()
export class SearchCustomersArgs {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  term: string;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
