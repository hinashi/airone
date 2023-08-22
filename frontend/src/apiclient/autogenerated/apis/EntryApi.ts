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

import * as runtime from "../runtime";
import type {
  AdvancedSearch,
  AdvancedSearchResult,
  AdvancedSearchResultExport,
  EntryBase,
  EntryCopy,
  EntryExport,
  EntryRetrieve,
  EntryUpdate,
  GetEntryAttrReferral,
  PaginatedEntryBaseList,
  PaginatedEntryHistoryAttributeValueList,
} from "../models";
import {
  AdvancedSearchFromJSON,
  AdvancedSearchToJSON,
  AdvancedSearchResultFromJSON,
  AdvancedSearchResultToJSON,
  AdvancedSearchResultExportFromJSON,
  AdvancedSearchResultExportToJSON,
  EntryBaseFromJSON,
  EntryBaseToJSON,
  EntryCopyFromJSON,
  EntryCopyToJSON,
  EntryExportFromJSON,
  EntryExportToJSON,
  EntryRetrieveFromJSON,
  EntryRetrieveToJSON,
  EntryUpdateFromJSON,
  EntryUpdateToJSON,
  GetEntryAttrReferralFromJSON,
  GetEntryAttrReferralToJSON,
  PaginatedEntryBaseListFromJSON,
  PaginatedEntryBaseListToJSON,
  PaginatedEntryHistoryAttributeValueListFromJSON,
  PaginatedEntryHistoryAttributeValueListToJSON,
} from "../models";

export interface EntryApiV2AdvancedSearchCreateRequest {
  advancedSearch: AdvancedSearch;
}

export interface EntryApiV2AdvancedSearchResultExportCreateRequest {
  advancedSearchResultExport: AdvancedSearchResultExport;
}

export interface EntryApiV2AttrReferralsListRequest {
  attrId: number;
  keyword?: string;
}

export interface EntryApiV2AttrvRestorePartialUpdateRequest {
  id: number;
}

export interface EntryApiV2AttrvRestoreUpdateRequest {
  id: number;
}

export interface EntryApiV2BulkDeleteDestroyRequest {
  ids?: Array<number>;
}

export interface EntryApiV2CopyCreateRequest {
  id: number;
  entryCopy: EntryCopy;
}

export interface EntryApiV2DestroyRequest {
  id: number;
}

export interface EntryApiV2ExportCreateRequest {
  entityId: number;
  entryExport?: EntryExport;
}

export interface EntryApiV2HistoriesListRequest {
  id: number;
  limit?: number;
  offset?: number;
}

export interface EntryApiV2ReferralListRequest {
  id: number;
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface EntryApiV2RestoreCreateRequest {
  id: number;
  entryBase?: EntryBase;
}

export interface EntryApiV2RetrieveRequest {
  id: number;
}

export interface EntryApiV2SearchListRequest {
  query?: string;
}

export interface EntryApiV2UpdateRequest {
  id: number;
  entryUpdate?: EntryUpdate;
}

/**
 *
 */
export class EntryApi extends runtime.BaseAPI {
  /**
   */
  async entryApiV2AdvancedSearchCreateRaw(
    requestParameters: EntryApiV2AdvancedSearchCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<AdvancedSearchResult>> {
    if (
      requestParameters.advancedSearch === null ||
      requestParameters.advancedSearch === undefined
    ) {
      throw new runtime.RequiredError(
        "advancedSearch",
        "Required parameter requestParameters.advancedSearch was null or undefined when calling entryApiV2AdvancedSearchCreate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/advanced_search/`,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: AdvancedSearchToJSON(requestParameters.advancedSearch),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      AdvancedSearchResultFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2AdvancedSearchCreate(
    requestParameters: EntryApiV2AdvancedSearchCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<AdvancedSearchResult> {
    const response = await this.entryApiV2AdvancedSearchCreateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2AdvancedSearchResultExportCreateRaw(
    requestParameters: EntryApiV2AdvancedSearchResultExportCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<AdvancedSearchResultExport>> {
    if (
      requestParameters.advancedSearchResultExport === null ||
      requestParameters.advancedSearchResultExport === undefined
    ) {
      throw new runtime.RequiredError(
        "advancedSearchResultExport",
        "Required parameter requestParameters.advancedSearchResultExport was null or undefined when calling entryApiV2AdvancedSearchResultExportCreate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/advanced_search_result_export/`,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: AdvancedSearchResultExportToJSON(
          requestParameters.advancedSearchResultExport
        ),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      AdvancedSearchResultExportFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2AdvancedSearchResultExportCreate(
    requestParameters: EntryApiV2AdvancedSearchResultExportCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<AdvancedSearchResultExport> {
    const response = await this.entryApiV2AdvancedSearchResultExportCreateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2AttrReferralsListRaw(
    requestParameters: EntryApiV2AttrReferralsListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<GetEntryAttrReferral>>> {
    if (
      requestParameters.attrId === null ||
      requestParameters.attrId === undefined
    ) {
      throw new runtime.RequiredError(
        "attrId",
        "Required parameter requestParameters.attrId was null or undefined when calling entryApiV2AttrReferralsList."
      );
    }

    const queryParameters: any = {};

    if (requestParameters.keyword !== undefined) {
      queryParameters["keyword"] = requestParameters.keyword;
    }

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{attr_id}/attr_referrals/`.replace(
          `{${"attr_id"}}`,
          encodeURIComponent(String(requestParameters.attrId))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      jsonValue.map(GetEntryAttrReferralFromJSON)
    );
  }

  /**
   */
  async entryApiV2AttrReferralsList(
    requestParameters: EntryApiV2AttrReferralsListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<GetEntryAttrReferral>> {
    const response = await this.entryApiV2AttrReferralsListRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2AttrvRestorePartialUpdateRaw(
    requestParameters: EntryApiV2AttrvRestorePartialUpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2AttrvRestorePartialUpdate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/attrv_restore/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "PATCH",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async entryApiV2AttrvRestorePartialUpdate(
    requestParameters: EntryApiV2AttrvRestorePartialUpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.entryApiV2AttrvRestorePartialUpdateRaw(
      requestParameters,
      initOverrides
    );
  }

  /**
   */
  async entryApiV2AttrvRestoreUpdateRaw(
    requestParameters: EntryApiV2AttrvRestoreUpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2AttrvRestoreUpdate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/attrv_restore/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async entryApiV2AttrvRestoreUpdate(
    requestParameters: EntryApiV2AttrvRestoreUpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.entryApiV2AttrvRestoreUpdateRaw(
      requestParameters,
      initOverrides
    );
  }

  /**
   */
  async entryApiV2BulkDeleteDestroyRaw(
    requestParameters: EntryApiV2BulkDeleteDestroyRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    const queryParameters: any = {};

    if (requestParameters.ids) {
      queryParameters["ids"] = requestParameters.ids;
    }

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/bulk_delete/`,
        method: "DELETE",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async entryApiV2BulkDeleteDestroy(
    requestParameters: EntryApiV2BulkDeleteDestroyRequest = {},
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.entryApiV2BulkDeleteDestroyRaw(requestParameters, initOverrides);
  }

  /**
   */
  async entryApiV2CopyCreateRaw(
    requestParameters: EntryApiV2CopyCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<EntryCopy>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2CopyCreate."
      );
    }

    if (
      requestParameters.entryCopy === null ||
      requestParameters.entryCopy === undefined
    ) {
      throw new runtime.RequiredError(
        "entryCopy",
        "Required parameter requestParameters.entryCopy was null or undefined when calling entryApiV2CopyCreate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/copy/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: EntryCopyToJSON(requestParameters.entryCopy),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      EntryCopyFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2CopyCreate(
    requestParameters: EntryApiV2CopyCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<EntryCopy> {
    const response = await this.entryApiV2CopyCreateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2DestroyRaw(
    requestParameters: EntryApiV2DestroyRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2Destroy."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "DELETE",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async entryApiV2Destroy(
    requestParameters: EntryApiV2DestroyRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.entryApiV2DestroyRaw(requestParameters, initOverrides);
  }

  /**
   */
  async entryApiV2ExportCreateRaw(
    requestParameters: EntryApiV2ExportCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<EntryExport>> {
    if (
      requestParameters.entityId === null ||
      requestParameters.entityId === undefined
    ) {
      throw new runtime.RequiredError(
        "entityId",
        "Required parameter requestParameters.entityId was null or undefined when calling entryApiV2ExportCreate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{entity_id}/export/`.replace(
          `{${"entity_id"}}`,
          encodeURIComponent(String(requestParameters.entityId))
        ),
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: EntryExportToJSON(requestParameters.entryExport),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      EntryExportFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2ExportCreate(
    requestParameters: EntryApiV2ExportCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<EntryExport> {
    const response = await this.entryApiV2ExportCreateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2HistoriesListRaw(
    requestParameters: EntryApiV2HistoriesListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PaginatedEntryHistoryAttributeValueList>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2HistoriesList."
      );
    }

    const queryParameters: any = {};

    if (requestParameters.limit !== undefined) {
      queryParameters["limit"] = requestParameters.limit;
    }

    if (requestParameters.offset !== undefined) {
      queryParameters["offset"] = requestParameters.offset;
    }

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/histories/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      PaginatedEntryHistoryAttributeValueListFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2HistoriesList(
    requestParameters: EntryApiV2HistoriesListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PaginatedEntryHistoryAttributeValueList> {
    const response = await this.entryApiV2HistoriesListRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2ImportCreateRaw(
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/import/`,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async entryApiV2ImportCreate(
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.entryApiV2ImportCreateRaw(initOverrides);
  }

  /**
   */
  async entryApiV2ReferralListRaw(
    requestParameters: EntryApiV2ReferralListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PaginatedEntryBaseList>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2ReferralList."
      );
    }

    const queryParameters: any = {};

    if (requestParameters.keyword !== undefined) {
      queryParameters["keyword"] = requestParameters.keyword;
    }

    if (requestParameters.limit !== undefined) {
      queryParameters["limit"] = requestParameters.limit;
    }

    if (requestParameters.offset !== undefined) {
      queryParameters["offset"] = requestParameters.offset;
    }

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/referral/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      PaginatedEntryBaseListFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2ReferralList(
    requestParameters: EntryApiV2ReferralListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PaginatedEntryBaseList> {
    const response = await this.entryApiV2ReferralListRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2RestoreCreateRaw(
    requestParameters: EntryApiV2RestoreCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<EntryBase>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2RestoreCreate."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/restore/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: EntryBaseToJSON(requestParameters.entryBase),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      EntryBaseFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2RestoreCreate(
    requestParameters: EntryApiV2RestoreCreateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<EntryBase> {
    const response = await this.entryApiV2RestoreCreateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2RetrieveRaw(
    requestParameters: EntryApiV2RetrieveRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<EntryRetrieve>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2Retrieve."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      EntryRetrieveFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2Retrieve(
    requestParameters: EntryApiV2RetrieveRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<EntryRetrieve> {
    const response = await this.entryApiV2RetrieveRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2SearchListRaw(
    requestParameters: EntryApiV2SearchListRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<EntryBase>>> {
    const queryParameters: any = {};

    if (requestParameters.query !== undefined) {
      queryParameters["query"] = requestParameters.query;
    }

    const headerParameters: runtime.HTTPHeaders = {};

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/search/`,
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      jsonValue.map(EntryBaseFromJSON)
    );
  }

  /**
   */
  async entryApiV2SearchList(
    requestParameters: EntryApiV2SearchListRequest = {},
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<EntryBase>> {
    const response = await this.entryApiV2SearchListRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async entryApiV2UpdateRaw(
    requestParameters: EntryApiV2UpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<EntryUpdate>> {
    if (requestParameters.id === null || requestParameters.id === undefined) {
      throw new runtime.RequiredError(
        "id",
        "Required parameter requestParameters.id was null or undefined when calling entryApiV2Update."
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    if (
      this.configuration &&
      (this.configuration.username !== undefined ||
        this.configuration.password !== undefined)
    ) {
      headerParameters["Authorization"] =
        "Basic " +
        btoa(this.configuration.username + ":" + this.configuration.password);
    }
    if (this.configuration && this.configuration.apiKey) {
      headerParameters["Authorization"] =
        this.configuration.apiKey("Authorization"); // tokenAuth authentication
    }

    const response = await this.request(
      {
        path: `/entry/api/v2/{id}/`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters.id))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
        body: EntryUpdateToJSON(requestParameters.entryUpdate),
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      EntryUpdateFromJSON(jsonValue)
    );
  }

  /**
   */
  async entryApiV2Update(
    requestParameters: EntryApiV2UpdateRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<EntryUpdate> {
    const response = await this.entryApiV2UpdateRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }
}
