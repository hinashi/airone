import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  IconButton,
  Typography,
  TextField,
  Autocomplete,
} from "@mui/material";
import React, { FC, useEffect, useState } from "react";
import { Control } from "react-hook-form";
import { UseFormSetValue } from "react-hook-form/dist/types/form";

import {
  EntityAttributeType,
  EntryAttributeValueObject,
} from "../../../apiclient/autogenerated";

import { BooleanAttributeValueField } from "./BooleanAttributeValueField";
import { DateAttributeValueField } from "./DateAttributeValueField";
import { EditableEntryAttrs } from "./EditableEntry";
import { Schema } from "./EntryFormSchema";
import {
  ArrayNamedObjectAttributeValueField,
  NamedObjectAttributeValueField,
  ObjectAttributeValueField,
} from "./ObjectAttributeValueField";
import {
  ArrayStringAttributeValueField,
  StringAttributeValueField,
} from "./StringAttributeValueField";

import { aironeApiClientV2 } from "apiclient/AironeApiClientV2";
import { DjangoContext } from "services/DjangoContext";

interface CommonProps {
  attrName: string;
  attrType: number;
  isMandatory: boolean;
  index?: number;
  handleChange: (attrName: string, attrType: number, valueInfo: any) => void;
}

const ElemReferral: FC<
  CommonProps & {
    multiple?: boolean;
    attrValue: { id: number; name: string } | { id: number; name: string }[];
    schemaId: number;
    disabled?: boolean;
    handleClickDeleteListItem?: (
      attrName: string,
      attrType: number,
      index?: number
    ) => void;
    handleClickAddListItem?: (
      attrName: string,
      attrType: number,
      index: number
    ) => void;
  }
> = ({
  multiple = false,
  attrName,
  attrValue,
  attrType,
  isMandatory,
  schemaId,
  index,
  disabled,
  handleChange,
  handleClickDeleteListItem,
  handleClickAddListItem,
}) => {
  const [keyword, setKeyword] = useState("");
  const [referrals, setReferrals] = useState<{ id: number; name: string }[]>(
    []
  );

  const djangoContext = DjangoContext.getInstance();

  useEffect(() => {
    (async () => {
      if (Number(attrType) & Number(djangoContext?.attrTypeValue.object)) {
        // TODO call it reactively to avoid loading API???
        const attrReferrals = await aironeApiClientV2.getEntryAttrReferrals(
          schemaId,
          keyword
        );
        const addReferrals: { id: number; name: string }[] = [];

        // Filter duplicate referrals.
        attrReferrals.forEach((result) => {
          if (!referrals.map((referral) => referral.id).includes(result.id)) {
            addReferrals.push(result);
          }
        });

        // Add current attr value to referrals.
        if (multiple) {
          (attrValue as Array<EntryAttributeValueObject | null>).forEach(
            (value) => {
              if (
                value != null &&
                !referrals.map((referral) => referral.id).includes(value.id)
              ) {
                addReferrals.push(value);
              }
            }
          );
        } else {
          if (attrValue) {
            if (
              !referrals
                .map((referral) => referral.id)
                .includes((attrValue as EntryAttributeValueObject).id)
            ) {
              addReferrals.push(attrValue as EntryAttributeValueObject);
            }
          }
        }
        setReferrals(referrals.concat(addReferrals));
      } else if (
        Number(attrType) & Number(djangoContext?.attrTypeValue.group)
      ) {
        const groups = await aironeApiClientV2.getGroups();
        const addReferrals: { id: number; name: string }[] = [];

        // Filter duplicate referrals.
        groups.forEach((result) => {
          if (!referrals.map((referral) => referral.id).includes(result.id)) {
            addReferrals.push(result);
          }
        });

        setReferrals(referrals.concat(addReferrals));
      } else if (Number(attrType) & Number(djangoContext?.attrTypeValue.role)) {
        const roles = await aironeApiClientV2.getRoles();
        const addReferrals: { id: number; name: string }[] = [];

        // Filter duplicate referrals.
        roles.forEach((result) => {
          if (!referrals.map((referral) => referral.id).includes(result.id)) {
            addReferrals.push(result);
          }
        });

        setReferrals(referrals.concat(addReferrals));
      }
    })();
  }, [keyword]);

  return (
    <Box>
      <Typography variant="caption" color="rgba(0, 0, 0, 0.6)">
        {Number(attrType) & Number(djangoContext?.attrTypeValue.object)
          ? "エントリを選択"
          : "グループを選択"}
      </Typography>
      <Box display="flex" alignItems="center">
        <Autocomplete
          sx={{ width: "280px" }}
          multiple={multiple}
          options={referrals}
          getOptionLabel={(option: { id: number; name: string }) => option.name}
          isOptionEqualToValue={(
            option: { id: number; name: string },
            value: { id: number; name: string }
          ) => option.id === value.id}
          value={attrValue}
          onChange={(e, value) => {
            handleChange(attrName, attrType, {
              index: index,
              value: value,
            });
          }}
          onInputChange={(e, value) => {
            // To run only if the user changes
            if (e) {
              setKeyword(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              error={
                isMandatory &&
                (multiple
                  ? (
                      attrValue as
                        | Array<EntryAttributeValueObject>
                        | Array<EntityAttributeType>
                    )?.length === 0
                  : !attrValue)
              }
              size="small"
              placeholder={
                multiple &&
                (
                  attrValue as
                    | Array<EntryAttributeValueObject>
                    | Array<EntityAttributeType>
                ).length
                  ? ""
                  : "-NOT SET-"
              }
            />
          )}
        />
        {index !== undefined && (
          <>
            {handleClickDeleteListItem != null && (
              <IconButton
                disabled={disabled}
                sx={{ mx: "20px" }}
                onClick={() =>
                  handleClickDeleteListItem(attrName, attrType, index)
                }
              >
                <DeleteOutlineIcon />
              </IconButton>
            )}
            {handleClickAddListItem != null && (
              <IconButton
                onClick={() =>
                  handleClickAddListItem(attrName, attrType, index)
                }
              >
                <AddIcon />
              </IconButton>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

interface Props {
  attrName: string;
  attrInfo: EditableEntryAttrs;
  handleChangeAttribute: (
    attrName: string,
    attrType: number,
    valueInfo: any
  ) => void;
  handleClickDeleteListItem: (
    attrName: string,
    attrType: number,
    index?: number
  ) => void;
  handleClickAddListItem: (
    attrName: string,
    attrType: number,
    index: number
  ) => void;
  control: Control<Schema>;
  setValue: UseFormSetValue<Schema>;
}

export const AttributeValueFields: FC<Props> = ({
  attrName,
  attrInfo,
  handleChangeAttribute,
  control,
  setValue,
}) => {
  const djangoContext = DjangoContext.getInstance();

  switch (attrInfo.type) {
    case djangoContext?.attrTypeValue.string:
      return (
        <StringAttributeValueField
          control={control}
          attrName={attrName}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
        />
      );

    case djangoContext?.attrTypeValue.text:
      return (
        <StringAttributeValueField
          control={control}
          attrName={attrName}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
          multiline
        />
      );

    case djangoContext?.attrTypeValue.date:
      return (
        <DateAttributeValueField
          attrName={attrName}
          isMandatory={attrInfo.isMandatory}
          control={control}
          setValue={setValue}
        />
      );

    case djangoContext?.attrTypeValue.boolean:
      return (
        <BooleanAttributeValueField
          attrName={attrName}
          isMandatory={attrInfo.isMandatory}
          control={control}
        />
      );

    case djangoContext?.attrTypeValue.object:
      return (
        <ObjectAttributeValueField
          attrName={attrName}
          control={control}
          setValue={setValue}
          schemaId={attrInfo.schema.id}
        />
      );

    case djangoContext?.attrTypeValue.group:
      return (
        <ElemReferral
          attrName={attrName}
          // @ts-ignore
          attrValue={attrInfo.value.asGroup}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
          schemaId={attrInfo.schema.id}
          handleChange={handleChangeAttribute}
        />
      );

    case djangoContext?.attrTypeValue.role:
      return (
        <ElemReferral
          attrName={attrName}
          // @ts-ignore
          attrValue={attrInfo.value.asRole}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
          schemaId={attrInfo.schema.id}
          handleChange={handleChangeAttribute}
        />
      );

    case djangoContext?.attrTypeValue.named_object:
      return (
        <NamedObjectAttributeValueField
          attrName={attrName}
          schemaId={attrInfo.schema.id}
          control={control}
          setValue={setValue}
        />
      );

    case djangoContext?.attrTypeValue.array_object:
      return (
        <ObjectAttributeValueField
          attrName={attrName}
          schemaId={attrInfo.schema.id}
          control={control}
          setValue={setValue}
          multiple
        />
      );

    case djangoContext?.attrTypeValue.array_group:
      return (
        <ElemReferral
          multiple={true}
          attrName={attrName}
          attrValue={attrInfo.value.asArrayGroup ?? []}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
          schemaId={attrInfo.schema.id}
          handleChange={handleChangeAttribute}
        />
      );

    case djangoContext?.attrTypeValue.array_role:
      return (
        <ElemReferral
          multiple={true}
          attrName={attrName}
          attrValue={attrInfo.value.asArrayRole ?? []}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
          schemaId={attrInfo.schema.id}
          handleChange={handleChangeAttribute}
        />
      );

    case djangoContext?.attrTypeValue.array_string:
      return (
        <ArrayStringAttributeValueField
          control={control}
          attrName={attrName}
          attrType={attrInfo.type}
          isMandatory={attrInfo.isMandatory}
        />
      );

    case djangoContext?.attrTypeValue.array_named_object:
      return (
        <ArrayNamedObjectAttributeValueField
          attrName={attrName}
          schemaId={attrInfo.schema.id}
          control={control}
          setValue={setValue}
        />
      );

    case djangoContext?.attrTypeValue.array_named_object_boolean:
      return (
        <ArrayNamedObjectAttributeValueField
          attrName={attrName}
          schemaId={attrInfo.schema.id}
          control={control}
          setValue={setValue}
          withBoolean
        />
      );

    default:
      throw new Error(`Unknown attribute type: ${attrInfo.type}`);
  }
};
