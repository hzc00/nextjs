import { z } from "zod";

// 定义错误处理策略接口
interface ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean;
  handle(issue: z.ZodIssue): { message: string };
}

// 无效类型错误处理器
class InvalidTypeHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.invalid_type;
  }

  handle(issue: z.ZodIssue): { message: string } {
    if (issue.code === z.ZodIssueCode.invalid_type) {
      const invalidTypeIssue = issue as z.ZodInvalidTypeIssue;
      if (invalidTypeIssue.received === "undefined" || invalidTypeIssue.received === "null") {
        return { message: "This field is required" };
      }
      if (invalidTypeIssue.expected === "string") {
        return { message: "Please enter text" };
      }
      if (invalidTypeIssue.expected === "number") {
        return { message: "Please enter a number" };
      }
    }
    return { message: `Invalid value type` };
  }
}

// 太小错误处理器
class TooSmallHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.too_small;
  }

  handle(issue: z.ZodIssue): { message: string } {
    if (issue.code === z.ZodIssueCode.too_small) {
      const tooSmallIssue = issue as z.ZodTooSmallIssue;
      if (tooSmallIssue.type === "string") {
        return { message: `Minimum ${tooSmallIssue.minimum} characters required` };
      }
      if (tooSmallIssue.type === "number") {
        return {
          message: `Number must be greater than or equal to ${tooSmallIssue.minimum}`,
        };
      }
    }
    return { message: `Value is too small` };
  }
}

// 太大错误处理器
class TooBigHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.too_big;
  }

  handle(issue: z.ZodIssue): { message: string } {
    if (issue.code === z.ZodIssueCode.too_big) {
      const tooBigIssue = issue as z.ZodTooBigIssue;
      if (tooBigIssue.type === "string") {
        return { message: `Maximum ${tooBigIssue.maximum} characters allowed` };
      }
      if (tooBigIssue.type === "number") {
        return {
          message: `Number must be less than or equal to ${tooBigIssue.maximum}`,
        };
      }
    }
    return { message: `Value is too large` };
  }
}

// 无效字符串错误处理器
class InvalidStringHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.invalid_string;
  }

  handle(issue: z.ZodIssue): { message: string } {
    if (issue.code === z.ZodIssueCode.invalid_string) {
      const invalidStringIssue = issue as z.ZodInvalidStringIssue;
      if (invalidStringIssue.validation === "email") {
        return { message: "Please enter a valid email address" };
      }
      if (invalidStringIssue.validation === "url") {
        return { message: "Please enter a valid URL" };
      }
    }
    return { message: "Invalid text format" };
  }
}

// 无效日期错误处理器
class InvalidDateHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.invalid_date;
  }

  handle(issue: z.ZodIssue): { message: string } {
    return { message: "Please enter a valid date" };
  }
}

// 自定义错误处理器
class CustomHandler implements ErrorHandler {
  canHandle(issue: z.ZodIssue): boolean {
    return issue.code === z.ZodIssueCode.custom;
  }

  handle(issue: z.ZodIssue): { message: string } {
    const customIssue = issue as z.ZodCustomIssue;
    return { message: customIssue.message || "Invalid value" };
  }
}

// 错误处理策略管理器
class ErrorHandlerManager {
  private handlers: ErrorHandler[] = [];

  constructor() {
    this.handlers = [
      new InvalidTypeHandler(),
      new TooSmallHandler(),
      new TooBigHandler(),
      new InvalidStringHandler(),
      new InvalidDateHandler(),
      new CustomHandler(),
    ];
  }

  handleError(issue: z.ZodIssue): { message: string } {
    const handler = this.handlers.find(h => h.canHandle(issue));
    if (handler) {
      return handler.handle(issue);
    }
    return { message: "Invalid value" };
  }
}

// 创建策略管理器实例
const errorHandlerManager = new ErrorHandlerManager();

// 重构后的错误映射函数
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  // 确保issue有message属性
  if (issue.message === undefined) {
    return { message: "Invalid value" };
  }
  return errorHandlerManager.handleError(issue as z.ZodIssue);
};

export { customErrorMap };