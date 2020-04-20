import path from 'path';
import csv from 'csvtojson';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  filename: string;
}
interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, filename);
    const csvTransactions = await csv().fromFile(csvFilePath);

    csvTransactions.map(async (transaction: CsvTransaction) => {
      const transactionsRepository = getCustomRepository(
        TransactionsRepository,
      );
      const categoriesRepository = getRepository(Category);

      const categories = await categoriesRepository.find();

      const category = categories.find(
        cat => cat.title === transaction.category,
      );

      let category_id: string;
      if (!category) {
        const newCategory = categoriesRepository.create({
          title: transaction.category,
        });
        await categoriesRepository.save(newCategory);

        category_id = newCategory.id;
      } else {
        category_id = category.id;
      }

      const newTransaction = transactionsRepository.create({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category_id,
      });

      await transactionsRepository.save(newTransaction);
    });

    return csvTransactions;
  }
}

export default ImportTransactionsService;
