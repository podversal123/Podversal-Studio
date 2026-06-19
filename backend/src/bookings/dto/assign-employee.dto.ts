import { IsString } from 'class-validator';

export class AssignEmployeeDto {
  @IsString()
  employeeId: string;
}
