function data=readdata(yyyymmdd)
fname = [yyyymmdd '.csv'];
if ~exist(fname,'file')
    downloaddata(yyyymmdd);
end

raw = csvread(fname,1,0);
ncb = size(raw,2) / 2;
data = cell(1,ncb);
for i = 1:ncb
    data{i} = raw(:,2*(i-1)+[1 2]);
end
