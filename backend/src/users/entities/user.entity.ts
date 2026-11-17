import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
export type UserRole = 'customer' | 'admin' | 'staff';
@Schema()
export class User {
  @Prop({ required: true, trim: true })
  name: string;
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;
  @Prop({ required: true, trim: true })
  passwordHash: string;
  @Prop({
    required: true,
    enum: ['customer', 'staff', 'admin'],
    default: 'customer',
  })
  role: UserRole;
  @Prop({ trim: true })
  branchId?: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
