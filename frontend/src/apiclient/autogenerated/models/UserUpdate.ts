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
 * @interface UserUpdate
 */
export interface UserUpdate {
  /**
   * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
   * @type {string}
   * @memberof UserUpdate
   */
  username: string;
  /**
   *
   * @type {string}
   * @memberof UserUpdate
   */
  email?: string;
  /**
   * Designates that this user has all permissions without explicitly assigning them.
   * @type {boolean}
   * @memberof UserUpdate
   */
  isSuperuser?: boolean;
}

/**
 * Check if a given object implements the UserUpdate interface.
 */
export function instanceOfUserUpdate(value: object): boolean {
  let isInstance = true;
  isInstance = isInstance && "username" in value;

  return isInstance;
}

export function UserUpdateFromJSON(json: any): UserUpdate {
  return UserUpdateFromJSONTyped(json, false);
}

export function UserUpdateFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): UserUpdate {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    username: json["username"],
    email: !exists(json, "email") ? undefined : json["email"],
    isSuperuser: !exists(json, "is_superuser")
      ? undefined
      : json["is_superuser"],
  };
}

export function UserUpdateToJSON(value?: UserUpdate | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    username: value.username,
    email: value.email,
    is_superuser: value.isSuperuser,
  };
}
