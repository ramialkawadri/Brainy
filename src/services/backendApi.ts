/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CellInfoDto {
  /** @format uuid */
  id?: string;
  data?: any;
  type?: CellType;
}

export interface CellRepetitionCountsDto {
  /** @format int32 */
  new?: number;
  /** @format int32 */
  learning?: number;
  /** @format int32 */
  relearning?: number;
  /** @format int32 */
  review?: number;
}

export interface CellRepetitionDto {
  /** @format uuid */
  cellId?: string;
  /** @format float */
  stability?: number;
  /** @format float */
  difficulty?: number;
  /** @format int32 */
  elapsedDays?: number;
  /** @format int32 */
  scheduledDays?: number;
  /** @format int32 */
  reps?: number;
  /** @format int32 */
  lapses?: number;
  state?: State;
  /** @format date-time */
  due?: string;
  /** @format date-time */
  lastReview?: string;
}

export enum CellType {
  FlashCard = "Flash Card",
  Note = "Note",
}

export interface FileInfoDto {
  /** @format uuid */
  id?: string;
  name?: string | null;
  repetitionCounts?: CellRepetitionCountsDto;
}

export interface LoginDto {
  username?: string | null;
  password?: string | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

export enum Rating {
  Again = "Again",
  Hard = "Hard",
  Good = "Good",
  Easy = "Easy",
}

export interface RegistrationDto {
  username?: string | null;
  password?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export enum State {
  New = "New",
  Learning = "Learning",
  Review = "Review",
  Relearning = "Relearning",
}

export interface UpdateUserInformationDto {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface UpdateUserPasswordDto {
  newPassword?: string | null;
}

export interface UserInformationDto {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Brainy.WebApi
 * @version 1.0
 */
export class BrainyBackendApi<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Auth
     * @name Login
     * @request POST:/api/Auth/login
     * @response `200` `void` OK
     * @response `401` `ProblemDetails` Unauthorized
     */
    login: (data: LoginDto, params: RequestParams = {}) =>
      this.request<void, ProblemDetails>({
        path: `/api/Auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Register
     * @request POST:/api/Auth/register
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     */
    register: (data: RegistrationDto, params: RequestParams = {}) =>
      this.request<void, ProblemDetails>({
        path: `/api/Auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Logout
     * @request POST:/api/Auth/logout
     * @response `200` `void` OK
     */
    logout: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Auth/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CellRepetition
     * @name GetFileCellRepetitions
     * @request GET:/api/CellRepetition
     * @response `200` `(CellRepetitionDto)[]` OK
     * @response `404` `ProblemDetails` Not Found
     */
    getFileCellRepetitions: (
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<CellRepetitionDto[], ProblemDetails>({
        path: `/api/CellRepetition`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags CellRepetition
     * @name RegisterCellRepetitionReview
     * @request POST:/api/CellRepetition
     * @response `200` `void` OK
     */
    registerCellRepetitionReview: (
      query?: {
        filePath?: string;
        /** @format uuid */
        cellId?: string;
        rating?: Rating;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/CellRepetition`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags CellRepetition
     * @name GetFileCellRepetitionsCounts
     * @request GET:/api/CellRepetition/Counts
     * @response `200` `CellRepetitionCountsDto` OK
     * @response `404` `ProblemDetails` Not Found
     */
    getFileCellRepetitionsCounts: (
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<CellRepetitionCountsDto, ProblemDetails>({
        path: `/api/CellRepetition/Counts`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name CreateFile
     * @request POST:/api/File
     * @response `200` `void` OK
     */
    createFile: (
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/File`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name GetFileContent
     * @request GET:/api/File
     * @response `200` `(CellInfoDto)[]` OK
     * @response `404` `ProblemDetails` Not Found
     */
    getFileContent: (
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<CellInfoDto[], ProblemDetails>({
        path: `/api/File`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name UpdateFile
     * @request PUT:/api/File
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     * @response `404` `ProblemDetails` Not Found
     */
    updateFile: (
      data: CellInfoDto[],
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/File`,
        method: "PUT",
        query: query,
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name DeleteFile
     * @request DELETE:/api/File
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     */
    deleteFile: (
      query?: {
        filePath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/File`,
        method: "DELETE",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags File
     * @name RenameFile
     * @request POST:/api/File/rename
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     */
    renameFile: (
      query?: {
        oldPath?: string;
        newPath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/File/rename`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Folder
     * @name CreateFolder
     * @request POST:/api/Folder
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     */
    createFolder: (
      query?: {
        folderPath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/Folder`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Folder
     * @name DeleteFolder
     * @request DELETE:/api/Folder
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     * @response `404` `ProblemDetails` Not Found
     */
    deleteFolder: (
      query?: {
        folderPath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/Folder`,
        method: "DELETE",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Folder
     * @name RenameFolder
     * @request POST:/api/Folder/rename
     * @response `200` `void` OK
     * @response `400` `ProblemDetails` Bad Request
     */
    renameFolder: (
      query?: {
        oldPath?: string;
        newPath?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, ProblemDetails>({
        path: `/api/Folder/rename`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GetUsedStorage
     * @request GET:/api/User/used-storage
     * @response `200` `number` OK
     */
    getUsedStorage: (params: RequestParams = {}) =>
      this.request<number, any>({
        path: `/api/User/used-storage`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name ListUserFiles
     * @request GET:/api/User/files
     * @response `200` `(FileInfoDto)[]` OK
     */
    listUserFiles: (params: RequestParams = {}) =>
      this.request<FileInfoDto[], any>({
        path: `/api/User/files`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GetUserInformation
     * @request GET:/api/User
     * @response `200` `UserInformationDto` OK
     */
    getUserInformation: (params: RequestParams = {}) =>
      this.request<UserInformationDto, any>({
        path: `/api/User`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UpdateUserInformation
     * @request PATCH:/api/User
     * @response `200` `void` OK
     */
    updateUserInformation: (data: UpdateUserInformationDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/User`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UpdatePassword
     * @request PATCH:/api/User/password
     * @response `200` `void` OK
     */
    updatePassword: (data: UpdateUserPasswordDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/User/password`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
}
