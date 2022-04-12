import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupIcon from "@mui/icons-material/Group";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Input,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Theme,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import React, { Fragment, FC, useMemo } from "react";
import { Link } from "react-router-dom";

import { aclPath } from "../../../Routes";
import { Entity } from "../../../apiclient/autogenerated";
import { AutoCompletedField } from "../../common/AutoCompletedField";

const BaseAttributeTypes = {
  object: 1 << 0,
  string: 1 << 1,
  text: 1 << 2,
  bool: 1 << 3,
  group: 1 << 4,
  date: 1 << 5,
  array: 1 << 10,
  named: 1 << 11,
};

export const AttributeTypes = {
  object: {
    name: "entry",
    type: BaseAttributeTypes.object,
  },
  string: {
    name: "string",
    type: BaseAttributeTypes.string,
  },
  named_object: {
    name: "named_entry",
    type: BaseAttributeTypes.object | BaseAttributeTypes.named,
  },
  array_object: {
    name: "array_entry",
    type: BaseAttributeTypes.object | BaseAttributeTypes.array,
  },
  array_string: {
    name: "array_string",
    type: BaseAttributeTypes.string | BaseAttributeTypes.array,
  },
  array_named_object: {
    name: "array_named_entry",
    type:
      BaseAttributeTypes.object |
      BaseAttributeTypes.named |
      BaseAttributeTypes.array,
  },
  array_group: {
    name: "array_group",
    type: BaseAttributeTypes.group | BaseAttributeTypes.array,
  },
  text: {
    name: "textarea",
    type: BaseAttributeTypes.text,
  },
  boolean: {
    name: "boolean",
    type: BaseAttributeTypes.bool,
  },
  group: {
    name: "group",
    type: BaseAttributeTypes.group,
  },
  date: {
    name: "date",
    type: BaseAttributeTypes.date,
  },
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: "white",
  },
  "&:nth-of-type(even)": {
    backgroundColor: "#607D8B0A",
  },
}));

const useStyles = makeStyles<Theme>((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
}));

interface Props {
  attributes: { [key: string]: any }[];
  referralEntities: Entity[];
  setAttributes: (attributes: { [key: string]: any }[]) => void;
}

export const AttributesFields: FC<Props> = ({
  attributes,
  referralEntities,
  setAttributes,
}) => {
  const classes = useStyles();

  const handleChangeAttributeValue = (
    index: number,
    key: string,
    value: any
  ) => {
    attributes[index][key] = value;
    setAttributes([...attributes]);
  };

  const handleAppendAttribute = () => {
    setAttributes([
      ...attributes,
      {
        name: "",
        type: AttributeTypes.string.type,
        is_mandatory: false,
        is_delete_in_chain: false,
        refIds: [],
      },
    ]);
  };

  const handleDeleteAttribute = (index: number) => {
    attributes[index] = {
      ...attributes[index],
      deleted: true,
    };
    setAttributes([...attributes]);
  };

  const attributeTypeMenuItems = useMemo(() => {
    return Object.keys(AttributeTypes).map((typename, index) => (
      <MenuItem key={index} value={AttributeTypes[typename].type}>
        {AttributeTypes[typename].name}
      </MenuItem>
    ));
  }, []);

  return (
    <Box>
      <Box my="32px">
        <Typography variant="h4" align="center">
          属性情報
        </Typography>
      </Box>

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#455A64" }}>
            <TableCell sx={{ color: "#FFFFFF" }}>属性名</TableCell>
            <TableCell sx={{ color: "#FFFFFF" }}>型</TableCell>
            <TableCell sx={{ color: "#FFFFFF" }}>必須</TableCell>
            <TableCell sx={{ color: "#FFFFFF" }}>関連削除</TableCell>
            <TableCell sx={{ color: "#FFFFFF" }}>属性の削除</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {attributes.map((attr, index) => (
            <Fragment key={index}>
              {attr.deleted !== true && (
                <StyledTableRow>
                  <TableCell>
                    <Input
                      type="text"
                      value={attr.name}
                      placeholder="属性名"
                      sx={{ width: "100%" }}
                      onChange={(e) =>
                        handleChangeAttributeValue(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      error={attr.name === ""}
                    />
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Box minWidth={100} marginX={1}>
                        <Select
                          fullWidth={true}
                          value={attr.type}
                          disabled={attr.id != null}
                          onChange={(e) =>
                            handleChangeAttributeValue(
                              index,
                              "type",
                              e.target.value
                            )
                          }
                        >
                          {attributeTypeMenuItems}
                        </Select>
                      </Box>
                      {(attr.type & BaseAttributeTypes.object) > 0 && (
                        <Box minWidth={100} marginX={1}>
                          <Typography>エンティティを選択</Typography>

                          <AutoCompletedField
                            options={referralEntities}
                            getOptionLabel={(option: Entity) => option.name}
                            defaultValue={referralEntities.filter((e) =>
                              attr.refIds.includes(e.id)
                            )}
                            handleChangeSelectedValue={(value: Entity[]) => {
                              handleChangeAttributeValue(
                                index,
                                "refIds",
                                value.map((i) => i.id)
                              );
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Checkbox
                      checked={attr.is_mandatory}
                      onChange={(e) =>
                        handleChangeAttributeValue(
                          index,
                          "is_mandatory",
                          e.target.checked
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Checkbox
                      checked={attr.is_delete_in_chain}
                      onChange={(e) =>
                        handleChangeAttributeValue(
                          index,
                          "is_delete_in_chain",
                          e.target.checked
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <IconButton
                      className={classes.button}
                      onClick={(e) => handleDeleteAttribute(index)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>

                  <TableCell>
                    {attr.id != null && (
                      <Button
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        startIcon={<GroupIcon />}
                        component={Link}
                        to={aclPath(attr.id)}
                      >
                        ACL
                      </Button>
                    )}
                  </TableCell>
                </StyledTableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      <Box my="32px">
        <Button
          className={classes.button}
          variant="outlined"
          color="primary"
          onClick={handleAppendAttribute}
        >
          属性追加
        </Button>
      </Box>
    </Box>
  );
};
