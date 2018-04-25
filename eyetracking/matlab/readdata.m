function data=readdata(yyyymmdd)
if nargin < 1
    % if no date specified, use today's date
    yyyymmdd = datestr(now,'yyyymmdd');
end

fname = [yyyymmdd '.csv'];
if ~exist(fname,'file')
    downloaddata(yyyymmdd);
end

raw = csvread(fname,1,0);
ncb = size(raw,2) / 3;
data = cell(1,ncb);
for i = 1:ncb
    starti = 3*(i-1)+1;
    data{i} = struct('x',raw(:,starti),'y',raw(:,starti+1), ...
        'duration',raw(:,starti+2));
end
