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
 * @interface PasswordResetConfirm
 */
export interface PasswordResetConfirm {
  /**
   *
   * @type {string}
   * @memberof PasswordResetConfirm
   */
  uidb64: string;
  /**
   *
   * @type {string}
   * @memberof PasswordResetConfirm
   */
  token: string;
  /**
   *
   * @type {string}
   * @memberof PasswordResetConfirm
   */
  password1: string;
  /**
   *
   * @type {string}
   * @memberof PasswordResetConfirm
   */
  password2: string;
}

export function PasswordResetConfirmFromJSON(json: any): PasswordResetConfirm {
  return PasswordResetConfirmFromJSONTyped(json, false);
}

export function PasswordResetConfirmFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): PasswordResetConfirm {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    uidb64: json["uidb64"],
    token: json["token"],
    password1: json["password1"],
    password2: json["password2"],
  };
}

export function PasswordResetConfirmToJSON(
  value?: PasswordResetConfirm | null
): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    uidb64: value.uidb64,
    token: value.token,
    password1: value.password1,
    password2: value.password2,
  };
}