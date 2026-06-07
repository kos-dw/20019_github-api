import { EmptySearchQueryError, InvalidPageError } from "@/app/_shared/github/domain";
import { DEFAULT_PER_PAGE, SEARCH_RESULT_HARD_LIMIT } from "@/config/github";
import { type Result, err, ok } from "@/utils/result";

const MAX_PAGE = Math.floor(SEARCH_RESULT_HARD_LIMIT / DEFAULT_PER_PAGE);

export class SearchQuery {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Result<SearchQuery, EmptySearchQueryError> {
    const value = raw.trim();
    if (value === "") return err(new EmptySearchQueryError());

    return ok(new SearchQuery(value));
  }

  get value(): string {
    return this._value;
  }
}

export class Page {
  private constructor(private readonly _value: number) {}

  static create(value: number): Result<Page, InvalidPageError> {
    if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE) {
      return err(new InvalidPageError());
    }

    return ok(new Page(value));
  }

  get value(): number {
    return this._value;
  }
}
