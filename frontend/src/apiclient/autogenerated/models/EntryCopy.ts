/* tslint:disable */
/* eslint-disable */
/**
 *
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.0.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from "../runtime";
/**
 *
 * @export
 * @interface EntryCopy
 */
export interface EntryCopy {
  /**
   *
   * @type {Array<string>}
   * @memberof EntryCopy
   */
  copyEntryNames: Array<string>;
}

/**
 * Check if a given object implements the EntryCopy interface.
 */
export function instanceOfEntryCopy(value: object): boolean {
  let isInstance = true;
  isInstance = isInstance && "copyEntryNames" in value;

  return isInstance;
}

export function EntryCopyFromJSON(json: any): EntryCopy {
  return EntryCopyFromJSONTyped(json, false);
}

export function EntryCopyFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): EntryCopy {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    copyEntryNames: json["copy_entry_names"],
  };
}

export function EntryCopyToJSON(value?: EntryCopy | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    copy_entry_names: value.copyEntryNames,
  };
}
