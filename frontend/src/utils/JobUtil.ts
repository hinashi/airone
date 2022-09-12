import { JobSerializers } from "../apiclient/autogenerated";

import { JobOperations, JobStatuses } from "./Constants";
import { LocalStorageKey, localStorageUtil } from "./LocalStorageUtil";

const jobStatusLabel = (jobStatus: number): string => {
  switch (jobStatus) {
    case JobStatuses.PREPARING:
      return "処理前";
    case JobStatuses.DONE:
      return "完了";
    case JobStatuses.ERROR:
      return "失敗";
    case JobStatuses.TIMEOUT:
      return "タイムアウト";
    case JobStatuses.PROCESSING:
      return "処理中";
    case JobStatuses.CANCELED:
      return "キャンセル";
    default:
      return "不明";
  }
};

export const jobOperationLabel = (jobOperation: number): string => {
  switch (jobOperation) {
    case JobOperations.CREATE_ENTRY:
    case JobOperations.CREATE_ENTITY:
      return "作成";
    case JobOperations.EDIT_ENTRY:
    case JobOperations.EDIT_ENTITY:
      return "編集";
    case JobOperations.DELETE_ENTITY:
    case JobOperations.DELETE_ENTRY:
      return "削除";
    case JobOperations.IMPORT_ENTRY:
    case JobOperations.IMPORT_ENTRY_V2:
      return "インポート";
    case JobOperations.EXPORT_ENTRY:
    case JobOperations.EXPORT_SEARCH_RESULT:
      return "エクスポート";
    case JobOperations.COPY_ENTRY:
    case JobOperations.DO_COPY_ENTRY:
      return "コピー";
    case JobOperations.RESTORE_ENTRY:
      return "復旧";
    default:
      return "不明";
  }
};

export const jobTargetLabel = (job: JobSerializers): string => {
  return `[${jobStatusLabel(job.status)}/${jobOperationLabel(job.operation)}] ${
    job.target.name
  }`;
};

export const getLatestCheckDate = (): Date | null => {
  const value = localStorageUtil.get(LocalStorageKey.JobLatestCheckDate);
  return value != null ? new Date(value) : null;
};

export const updateLatestCheckDate = (date: Date) => {
  localStorageUtil.set(LocalStorageKey.JobLatestCheckDate, date.toISOString());
};