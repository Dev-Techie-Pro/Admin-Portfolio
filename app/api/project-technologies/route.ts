import { getProjectTechnologyUsage } from '@/lib/cms/repository';
import { withStaffGet } from '@/lib/api/with-staff-get';

export async function GET() {
  return withStaffGet(() => getProjectTechnologyUsage(), { maxAgeSec: 180 });
}
