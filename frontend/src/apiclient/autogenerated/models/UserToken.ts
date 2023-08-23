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
 * @interface UserToken
 */
export interface UserToken {
  /**
   *
   * @type {string}
   * @memberof UserToken
   */
  readonly key: string;
}

/**
 * Check if a given object implements the UserToken interface.
 */
export function instanceOfUserToken(value: object): boolean {
  let isInstance = true;
  isInstance = isInstance && "key" in value;

  return isInstance;
}

export function UserTokenFromJSON(json: any): UserToken {
  return UserTokenFromJSONTyped(json, false);
}

export function UserTokenFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): UserToken {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    key: json["key"],
  };
}

export function UserTokenToJSON(value?: UserToken | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {};
}