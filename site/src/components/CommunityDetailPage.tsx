import type { ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Chip,
  Container,
  Divider,
  Link,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactMarkdown from "react-markdown";
import type { Community } from "../lib/types";
import { formatDistanceWithTime, withBaseUrl } from "../lib/format";

interface Props {
  community: Community;
}

function YesNoChip({ value, label }: { value?: boolean; label: string }) {
  return (
    <Chip
      label={`${label}: ${value ? "是" : "否"}`}
      color={value ? "success" : "default"}
      variant={value ? "filled" : "outlined"}
    />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

export default function CommunityDetailPage({ community }: Props) {
  const baseUrl = import.meta.env.BASE_URL || "/";

  return (
    <Box sx={{ pb: 3 }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {community.name_zh}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2 }}>
        <Stack spacing={2}>
          {community.images?.cover && (
            <Box
              component="img"
              src={withBaseUrl(baseUrl, community.images.cover)}
              alt={community.name_zh}
              sx={{ width: "100%", borderRadius: 2 }}
            />
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {community.tags.map((tag) => (
              <Chip key={tag} label={tag} sx={{ mb: 1 }} />
            ))}
          </Stack>

          <Section title="基础信息">
            <Stack spacing={1}>
              <Typography>区域：{community.district ?? "-"}</Typography>
              <Typography>片区：{community.area ?? "-"}</Typography>
              <Typography>建成年份：{community.build?.build_year_range ?? "-"}</Typography>
              <Typography>价格等级：{community.price?.level ?? "-"}</Typography>
              <Typography>参考单价：{community.price?.ref_wan_per_sqm ?? "-"} 万/㎡</Typography>
              <Typography>参考总价：{community.price?.ref_total_wan_range ?? "-"} 万</Typography>
            </Stack>
          </Section>

          <Section title="距离">
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">地铁</Typography>
              {(community.distance?.metro ?? []).map((item, index) => (
                <Typography key={`${item.station}-${index}`}>
                  {[item.line, item.station].filter(Boolean).join(" / ") || "未知地铁站"}：
                  {formatDistanceWithTime(item.distance_m)}
                </Typography>
              ))}
              <Divider />
              <Typography variant="subtitle2">目标地点</Typography>
              {(community.distance?.to_targets ?? []).map((item, index) => (
                <Typography key={`${item.id}-${index}`}>
                  {item.name || item.id || "目标地点"}：{formatDistanceWithTime(item.distance_m)}
                </Typography>
              ))}
            </Stack>
          </Section>

          <Section title="物业与配套">
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <YesNoChip label="泳池" value={community.property?.has_pool} />
                <YesNoChip label="儿童乐园" value={community.property?.has_kids_playground} />
                <YesNoChip label="人车分流" value={community.property?.has_separation_ped_car} />
              </Stack>
              <Typography>
                物业费：{community.property?.management_fee?.cny_per_sqm_month_range ?? "-"}
              </Typography>
              <Typography>停车月租：{community.property?.parking?.monthly_rent_cny_range ?? "-"}</Typography>
              <Typography>车位价格：{community.property?.parking?.spot_price_wan_range ?? "-"}</Typography>
              {community.property?.facilities_note && (
                <Typography>备注：{community.property.facilities_note}</Typography>
              )}
            </Stack>
          </Section>

          <Section title="房产形态">
            <Stack spacing={2}>
              {(community.housing_stock?.building_types ?? []).map((item, index) => (
                <Box key={`${item.type}-${index}`} sx={{ p: 1.2, border: "1px solid #d8e1ec", borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {item.type || "类型未填"} / 总楼层 {item.total_floors_range || "-"}
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {(item.layouts ?? []).map((layout, layoutIndex) => (
                      <Stack
                        key={`${layout.area_sqm_range}-${layoutIndex}`}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={layout.area_sqm_range}
                          color={layout.main_supply ? "primary" : "default"}
                          variant={layout.main_supply ? "filled" : "outlined"}
                        />
                        <Typography variant="body2">
                          {(layout.layout_tags ?? []).join(" / ") || "无户型标签"}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Section>

          <Section title="链接">
            <Stack spacing={1}>
              {(community.links ?? []).map((item, index) => (
                <Link href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}>
                  {item.title || item.url}
                </Link>
              ))}
            </Stack>
          </Section>

          {community.notes_md && (
            <Section title="备注">
              <Box sx={{ lineHeight: 1.8, overflowX: "auto" }}>
                <ReactMarkdown>{community.notes_md}</ReactMarkdown>
              </Box>
            </Section>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
