import { ListDeviceSnapshotsUseCase } from "../UseCases/ListDeviceSnapshotsUseCase";

export class ListDeviceSnapshotsHandler {
  constructor(private readonly useCase: ListDeviceSnapshotsUseCase) {}

  async handle() {
    return this.useCase.execute();
  }
}
