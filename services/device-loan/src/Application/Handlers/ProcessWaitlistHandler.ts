import { ProcessWaitlistUseCase } from "../UseCases/ProcessWaitlistUseCase";

/**
 * ProcessWaitlistHandler
 * 
 * Handles processing the waitlist when a device becomes available
 */
export class ProcessWaitlistHandler {
  constructor(private readonly useCase: ProcessWaitlistUseCase) {}

  async execute(deviceId: string): Promise<void> {
    await this.useCase.execute(deviceId);
  }
}
