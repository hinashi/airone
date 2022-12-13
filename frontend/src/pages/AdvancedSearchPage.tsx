import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  TextField,
  Typography,
} from "@mui/material";
import React, { FC, useMemo, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useAsync } from "react-use";

import { aironeApiClientV2 } from "../apiclient/AironeApiClientV2";
import { EntityList } from "../apiclient/autogenerated";
import { AutocompleteWithAllSelector } from "../components/common/AutocompleteWithAllSelector";
import { PageHeader } from "../components/common/PageHeader";

import { advancedSearchResultPath, topPath } from "Routes";
import { AironeBreadcrumbs } from "components/common/AironeBreadcrumbs";

export const AdvancedSearchPage: FC = () => {
  const history = useHistory();

  const [selectedEntities, setSelectedEntities] = useState<Array<EntityList>>(
    []
  );
  const [selectedAttrs, setSelectedAttrs] = useState<Array<string>>([]);
  const [searchAllEntities, setSearchAllEntities] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  const entities = useAsync(async () => {
    const entities = await aironeApiClientV2.getEntities();
    return entities.results;
  });

  const attrs = useAsync(async () => {
    if (selectedEntities.length > 0 || searchAllEntities) {
      return await aironeApiClientV2.getEntityAttrs(
        selectedEntities.map((e) => e.id),
        searchAllEntities
      );
    }
    return [];
  }, [selectedEntities, searchAllEntities]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();

    selectedEntities.forEach((e) => {
      params.append("entity", e.id.toString());
    });
    if (searchAllEntities) {
      params.append("is_all_entities", "true");
    }
    params.append(
      "attrinfo",
      JSON.stringify(selectedAttrs.map((attr) => ({ name: attr })))
    );
    if (hasReferral) {
      params.append("has_referral", "true");
    }

    return params;
  }, [selectedEntities, searchAllEntities, selectedAttrs, hasReferral]);

  const handleCancel = () => {
    history.goBack();
  };

  return (
    <Box className="container-fluid">
      <AironeBreadcrumbs>
        <Typography component={Link} to={topPath()}>
          Top
        </Typography>
        <Typography color="textPrimary">高度な検索</Typography>
      </AironeBreadcrumbs>

      <PageHeader
        title="高度な検索"
        componentSubmits={
          <Box display="flex" justifyContent="center">
            <Box mx="4px">
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                to={`${advancedSearchResultPath()}?${searchParams}`}
                disabled={selectedEntities.length === 0 && !searchAllEntities}
              >
                検索
              </Button>
            </Box>
            <Box mx="4px">
              <Button variant="outlined" color="primary" onClick={handleCancel}>
                キャンセル
              </Button>
            </Box>
          </Box>
        }
      />

      <Box sx={{ marginTop: "111px", paddingLeft: "10%", paddingRight: "10%" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          my="128px"
        >
          <Typography variant="h4" my="20px">
            検索対象のエンティティ
          </Typography>

          {!entities.loading && (
            <Autocomplete
              options={entities.value}
              getOptionLabel={(option: EntityList) => option.name}
              value={selectedEntities}
              onChange={(_, value: Array<EntityList>) =>
                setSelectedEntities(value)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="エンティティを選択"
                />
              )}
              multiple
              sx={{ width: "100%", margin: "20px 0" }}
            />
          )}
          <Box>
            検索対象を絞り込まない
            <Checkbox
              checked={searchAllEntities}
              onChange={(e) => setSearchAllEntities(e.target.checked)}
            ></Checkbox>
          </Box>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          my="128px"
        >
          <Typography variant="h4" my="20px">
            属性
          </Typography>

          {!attrs.loading && (
            <AutocompleteWithAllSelector
              selectAllLabel="すべて選択"
              options={attrs.value}
              value={selectedAttrs}
              onChange={(_, value: Array<string>) => setSelectedAttrs(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="属性を選択"
                />
              )}
              multiple
              sx={{ width: "100%", margin: "20px 0" }}
            />
          )}
          <Box>
            参照エントリも含める
            <Checkbox
              checked={hasReferral}
              onChange={(e) => setHasReferral(e.target.checked)}
            ></Checkbox>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
