import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

class Item {
  @ApiProperty()
  @IsNumber()
  quantity: number;
}

class Service {
  @ApiProperty({ type: [Item] })
  items: Item[];
}

class Laundry {
  @ApiProperty()
  @IsString()
  name: string;
}

export class Order {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty({ type: [Service] })
  services: Service[];

  @ApiProperty({ type: Laundry })
  laundry: Laundry;

  @ApiProperty()
  @IsNumber()
  totalQuantity: number;
}

export class AllOrderListDto {
  @ApiProperty({ type: [Order] })
  data: Order[];

  @ApiProperty()
  count: number;
}
