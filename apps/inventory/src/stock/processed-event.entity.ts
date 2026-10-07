import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn('uuid')
  eventId: string;

  @CreateDateColumn()
  processedAt: Date;
}
