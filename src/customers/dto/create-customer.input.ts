import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateCustomerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @Field()
  @IsString()
  @Matches(/^[A-Z0-9-]{5,30}$/i, { message: 'documentId format is invalid' })
  documentId: string;

  @Field()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}