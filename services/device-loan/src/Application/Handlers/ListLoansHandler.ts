import { ListLoansDto } from "../Dtos/ListLoansDto";
import { ListLoansUseCase } from "../UseCases/ListLoansUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class ListLoansHandler {
  constructor(private readonly useCase: ListLoansUseCase) {}

  async execute(filter: ListLoansDto): Promise<LoanRecord[]> {
    return this.useCase.execute(filter);
  }
}
