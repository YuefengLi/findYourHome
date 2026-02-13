import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HomeIcon from "@mui/icons-material/Home";
import type { Community } from "../lib/types";
import { formatDistanceWithTime, getNearestMetroDistance, getNearestMetroLabel, withBaseUrl } from "../lib/format";

const COMPARE_KEY = "compare_community_ids";
const MAX_COMPARE_COUNT = 6;

interface Props {
  communities: Community[];
}

function getMainSupplyByRange(community: Community, range: string): string {
  const buildingTypes = community.housing_stock?.building_types ?? [];
  const hits: string[] = [];
  buildingTypes.forEach((buildingType) => {
    const matched = (buildingType.layouts ?? []).find(
      (layout) => layout.area_sqm_range === range && layout.main_supply
    );
    if (matched) {
      hits.push(buildingType.type || "未命名类型");
    }
  });
  return hits.length > 0 ? hits.join(" / ") : "-";
}

function getTargetChartConfig(selected: Community[]) {
  const firstTarget = selected
    .flatMap((community) => community.distance?.to_targets ?? [])
    .find((target) => target?.id);

  if (!firstTarget?.id) {
    return null;
  }

  const values = selected.map((community) => {
    const hit = (community.distance?.to_targets ?? []).find((item) => item.id === firstTarget.id);
    return hit?.distance_m ?? 0;
  });

  if (values.every((value) => value === 0)) {
    return null;
  }

  return {
    title: { text: `${firstTarget.name || firstTarget.id} 距离（m）` },
    tooltip: {},
    xAxis: { type: "category", data: selected.map((item) => item.name_zh) },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: values }]
  };
}

export default function ComparePage({ communities }: Props) {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("ids");
    if (fromUrl) {
      const ids = fromUrl
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_COUNT);
      setCompareIds(ids);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
      return;
    }

    const fromStorage = localStorage.getItem(COMPARE_KEY);
    if (!fromStorage) return;
    try {
      const parsed = JSON.parse(fromStorage);
      if (Array.isArray(parsed)) {
        setCompareIds(parsed.map(String).slice(0, MAX_COMPARE_COUNT));
      }
    } catch {
      localStorage.removeItem(COMPARE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const selected = useMemo(
    () =>
      compareIds
        .map((id) => communities.find((community) => community.id === id))
        .filter(Boolean) as Community[],
    [communities, compareIds]
  );

  const removeOne = (id: string) => setCompareIds((prev) => prev.filter((item) => item !== id));
  const clearAll = () => setCompareIds([]);

  const priceChart = {
    title: { text: "参考单价（万/㎡）" },
    tooltip: {},
    xAxis: { type: "category", data: selected.map((item) => item.name_zh) },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: selected.map((item) => item.price?.ref_wan_per_sqm ?? 0)
      }
    ]
  };

  const metroChart = {
    title: { text: "最近地铁距离（m）" },
    tooltip: {},
    xAxis: { type: "category", data: selected.map((item) => item.name_zh) },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: selected.map((item) => getNearestMetroDistance(item) ?? 0)
      }
    ]
  };

  const targetChart = getTargetChartConfig(selected);

  if (selected.length < 2) {
    return (
      <Box>
        <AppBar position="sticky" color="inherit" elevation={1}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              小区对比
            </Typography>
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              href={withBaseUrl(baseUrl, "communities")}
            >
              首页
            </Button>
          </Toolbar>
        </AppBar>
        <Container sx={{ py: 3 }}>
          <Alert severity="warning">对比至少需要 2 个小区，请先回列表页勾选。</Alert>
          <Button sx={{ mt: 2 }} href={withBaseUrl(baseUrl, "communities")} variant="contained">
            返回小区列表
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            小区对比
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              href={withBaseUrl(baseUrl, "communities")}
            >
              首页
            </Button>
            <Button color="inherit" onClick={clearAll}>
              清空
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {selected.map((item) => (
              <Chip
                key={item.id}
                label={item.name_zh}
                onDelete={() => removeOne(item.id)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>

          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>字段</TableCell>
                  {selected.map((community) => (
                    <TableCell key={community.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 700 }}>{community.name_zh}</Typography>
                        <IconButton size="small" onClick={() => removeOne(community.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>区域 / 片区</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-district`}>
                      {[c.district, c.area].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>建成年份</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-build`}>{c.build?.build_year_range ?? "-"}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>参考单价（万/㎡）</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-unit-price`}>{c.price?.ref_wan_per_sqm ?? "-"}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>参考总价（万）</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-total-price`}>{c.price?.ref_total_wan_range ?? "-"}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>最近地铁</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-metro`}>{getNearestMetroLabel(c)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>泳池 / 儿童乐园 / 人车分流</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-features`}>
                      {[c.property?.has_pool, c.property?.has_kids_playground, c.property?.has_separation_ped_car]
                        .map((item) => (item ? "是" : "否"))
                        .join(" / ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>物业费</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-mgmt`}>
                      {c.property?.management_fee?.cny_per_sqm_month_range ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>停车月租</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-parking-rent`}>
                      {c.property?.parking?.monthly_rent_cny_range ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>车位价格（万）</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-parking-price`}>
                      {c.property?.parking?.spot_price_wan_range ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>主供面积段 80-90</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-main-80-90`}>{getMainSupplyByRange(c, "80-90")}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>主供面积段 90-100</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-main-90-100`}>{getMainSupplyByRange(c, "90-100")}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell>主供面积段 100-120</TableCell>
                  {selected.map((c) => (
                    <TableCell key={`${c.id}-main-100-120`}>{getMainSupplyByRange(c, "100-120")}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Paper sx={{ p: 1 }}>
            <ReactECharts option={priceChart} style={{ height: 320 }} />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <ReactECharts option={metroChart} style={{ height: 320 }} />
          </Paper>
          {targetChart && (
            <Paper sx={{ p: 1 }}>
              <ReactECharts option={targetChart} style={{ height: 320 }} />
            </Paper>
          )}

          <Typography variant="caption" color="text.secondary">
            距离展示规则：{formatDistanceWithTime(850)}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
