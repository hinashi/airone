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

/**
 *
 * @export
 * @enum {string}
 */
export enum AuthenticateTypeEnum {
  NUMBER_1 = 1,
  NUMBER_2 = 2,
}

export function AuthenticateTypeEnumFromJSON(json: any): AuthenticateTypeEnum {
  return AuthenticateTypeEnumFromJSONTyped(json, false);
}

export function AuthenticateTypeEnumFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): AuthenticateTypeEnum {
  return json as AuthenticateTypeEnum;
}

export function AuthenticateTypeEnumToJSON(
  value?: AuthenticateTypeEnum | null
): any {
  return value as any;
}