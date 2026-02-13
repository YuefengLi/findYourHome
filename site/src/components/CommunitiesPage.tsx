import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ClearIcon from "@mui/icons-material/Clear";
import type { Community } from "../lib/types";
import {
  formatDistanceWithTime,
  getBuildStartYear,
  getNearestMetroDistance,
  withBaseUrl
} from "../lib/format";

const COMPARE_KEY = "compare_community_ids";
const MAX_COMPARE_COUNT = 6;

type SortKey = "updated_desc" | "price_asc" | "metro_asc" | "build_year_desc";

interface Props {
  communities: Community[];
}

function uniqueValues(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

export default function CommunitiesPage({ communities }: Props) {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [district, setDistrict] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortKey>("updated_desc");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem(COMPARE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
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

  const allTags = useMemo(
    () => uniqueValues(communities.flatMap((community) => community.tags)),
    [communities]
  );
  const allDistricts = useMemo(
    () => uniqueValues(communities.map((community) => community.district)),
    [communities]
  );
  const allAreas = useMemo(
    () => uniqueValues(communities.map((community) => community.area)),
    [communities]
  );

  const filteredCommunities = useMemo(() => {
    const filtered = communities.filter((community) => {
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => community.tags.includes(tag));
      const matchDistrict = !district || community.district === district;
      const matchArea = !area || community.area === area;
      return matchTags && matchDistrict && matchArea;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price_asc": {
          const aVal = a.price?.ref_wan_per_sqm ?? Number.MAX_SAFE_INTEGER;
          const bVal = b.price?.ref_wan_per_sqm ?? Number.MAX_SAFE_INTEGER;
          return aVal - bVal;
        }
        case "metro_asc": {
          const aVal = getNearestMetroDistance(a) ?? Number.MAX_SAFE_INTEGER;
          const bVal = getNearestMetroDistance(b) ?? Number.MAX_SAFE_INTEGER;
          return aVal - bVal;
        }
        case "build_year_desc": {
          const aVal = getBuildStartYear(a) ?? 0;
          const bVal = getBuildStartYear(b) ?? 0;
          return bVal - aVal;
        }
        case "updated_desc":
        default: {
          return Date.parse(b.updated_at) - Date.parse(a.updated_at);
        }
      }
    });
  }, [area, communities, district, selectedTags, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const toggleCompare = (id: string, checked: boolean) => {
    setCompareIds((prev) => {
      if (!checked) {
        return prev.filter((item) => item !== id);
      }
      if (prev.includes(id)) {
        return prev;
      }
      if (prev.length >= MAX_COMPARE_COUNT) {
        setToast("最多只能选择 6 个小区进行对比");
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearCompare = () => setCompareIds([]);

  const goCompare = () => {
    if (compareIds.length < 2) {
      setToast("至少选择 2 个小区后才能对比");
      return;
    }
    window.location.href = withBaseUrl(baseUrl, `compare?ids=${compareIds.join(",")}`);
  };

  return (
    <Box sx={{ pb: 12 }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            小区列表
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2 }}>
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {allTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      color={selectedTags.includes(tag) ? "primary" : "default"}
                      onClick={() => toggleTag(tag)}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>区域</InputLabel>
                      <Select
                        value={district}
                        label="区域"
                        onChange={(event) => setDistrict(event.target.value)}
                      >
                        <MenuItem value="">全部</MenuItem>
                        {allDistricts.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>片区</InputLabel>
                      <Select value={area} label="片区" onChange={(event) => setArea(event.target.value)}>
                        <MenuItem value="">全部</MenuItem>
                        {allAreas.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>排序</InputLabel>
                      <Select
                        value={sortBy}
                        label="排序"
                        onChange={(event) => setSortBy(event.target.value as SortKey)}
                      >
                        <MenuItem value="updated_desc">最近更新（新到旧）</MenuItem>
                        <MenuItem value="price_asc">参考单价（低到高）</MenuItem>
                        <MenuItem value="metro_asc">最近地铁距离（近到远）</MenuItem>
                        <MenuItem value="build_year_desc">楼龄（新到旧）</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {filteredCommunities.length === 0 && (
            <Alert severity="info">暂无符合筛选条件的小区</Alert>
          )}

          <Grid container spacing={2}>
            {filteredCommunities.map((community) => {
              const checked = compareIds.includes(community.id);
              return (
                <Grid key={community.id} item xs={12} sm={6} lg={4}>
                  <Card variant="outlined">
                    {community.images?.cover ? (
                      <CardMedia
                        component="img"
                        height="170"
                        image={withBaseUrl(baseUrl, community.images.cover)}
                        alt={community.name_zh}
                      />
                    ) : (
                      <Box sx={{ height: 170, bgcolor: "#dbe4ec" }} />
                    )}
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            component="a"
                            href={withBaseUrl(baseUrl, `communities/${community.routeKey}`)}
                            variant="h6"
                            sx={{ fontWeight: 700 }}
                          >
                            {community.name_zh}
                          </Typography>
                          <Checkbox
                            checked={checked}
                            onChange={(event) => toggleCompare(community.id, event.target.checked)}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {[community.district, community.area].filter(Boolean).join(" / ") || "-"}
                        </Typography>
                        <Typography variant="body2">
                          单价: {community.price?.ref_wan_per_sqm ?? "-"} 万/㎡
                        </Typography>
                        <Typography variant="body2">
                          总价段: {community.price?.ref_total_wan_range ?? "-"} 万
                        </Typography>
                        <Typography variant="body2">
                          最近地铁: {formatDistanceWithTime(getNearestMetroDistance(community))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          更新于 {community.updated_at}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {community.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" onClick={() => toggleTag(tag)} sx={{ mb: 1 }} />
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </Container>

      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: "rgba(18, 32, 47, 0.95)",
          color: "#fff",
          px: 2,
          py: 1.2
        }}
      >
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2">已选 {compareIds.length}/6</Typography>
              <Typography variant="caption" sx={{ display: "block", opacity: 0.85 }}>
                {compareIds
                  .map((id) => communities.find((item) => item.id === id)?.name_zh)
                  .filter(Boolean)
                  .join("、") || "尚未选择"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CompareArrowsIcon />}
                onClick={goCompare}
                disabled={compareIds.length < 2}
              >
                去对比
              </Button>
              <IconButton aria-label="clear" onClick={clearCompare} sx={{ color: "#fff" }}>
                <ClearIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast("")}>
        <Alert severity="warning">{toast}</Alert>
      </Snackbar>
    </Box>
  );
}
