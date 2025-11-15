import { ListLoansFilter } from "../Dtos/ListLoansDto";
import { ListLoansUseCase } from "../UseCases/ListLoansUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class ListLoansHandler {
  constructor(private readonly useCase: ListLoansUseCase) {}

  async execute(filter: ListLoansFilter): Promise<LoanRecord[]> {
    return this.useCase.execute(filter);
  }
}
